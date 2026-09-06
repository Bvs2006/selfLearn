/**
 * AlgoMaster Curriculum Importer & Updater
 * Run with: npx tsx scripts/import-algomaster.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const CONFIG = [
  {
    id: 'lld',
    name: 'Low Level Design',
    slug: 'lld',
    source: 'AlgoMaster',
    sourceUrl: 'https://algomaster.io/learn/lld/course-introduction',
    description: 'Master Object-Oriented Design, SOLID principles, 38 design patterns, and real-world system low-level design problems.',
  },
  {
    id: 'system-design',
    name: 'System Design',
    slug: 'system-design',
    source: 'AlgoMaster',
    sourceUrl: 'https://algomaster.io/learn/system-design/course-introduction',
    description: 'Master distributed systems, scalability, database scaling, microservices patterns, and large-scale architectural designs.',
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zmlbijflvrukttlrfhlo.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptbGJpamZsdnJ1a3R0bHJmaGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzODg1NzEsImV4cCI6MjEwMDk2NDU3MX0.YXMDV-vgBL37ZDCitUBqxVcv5uR-1HFCV7FP-kInbA0';
const supabase = createClient(supabaseUrl, supabaseKey);

function inferType(title: string) {
  const t = title.toLowerCase();
  if (t.startsWith('quiz') || t.includes('quiz')) return 'quiz';
  if (t.startsWith('exercise') || t.includes('exercise')) return 'exercise';
  if (t.startsWith('design ') || t.includes('interview problem')) return 'design_problem';
  if (t.includes('interview') || t.includes('approach') || t.includes('tips')) return 'interview_resource';
  return 'chapter';
}

function inferDifficulty(title: string, type: string) {
  const t = title.toLowerCase();
  if (type === 'quiz' || type === 'exercise') return 'Practice';
  if (type === 'design_problem') {
    if (t.includes('tic tac toe') || t.includes('parking lot') || t.includes('atm') || t.includes('coffee')) return 'Medium';
    if (t.includes('uber') || t.includes('stock exchange') || t.includes('search engine') || t.includes('distributed')) return 'Hard';
    return 'Medium';
  }
  if (t.includes('intro') || t.includes('welcome') || t.includes('roadmap') || t.includes('what is')) return 'Beginner';
  if (t.includes('advanced') || t.includes('distributed') || t.includes('consensus') || t.includes('concurrency')) return 'Advanced';
  return 'Intermediate';
}

async function extractFromHtml(html: string, courseId: string) {
  const linkRegex = /<a[^>]*data-chapter-id="([^"]+)"[^>]*href="([^"]+)"[\s\S]*?<span[^>]*class="leading-snug break-words whitespace-normal[^"]*">([^<]+)<\/span>/g;
  const allItems: { chapterId: string; href: string; title: string; indexInHtml: number }[] = [];
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    allItems.push({
      chapterId: m[1],
      href: m[2],
      title: m[3].trim(),
      indexInHtml: m.index,
    });
  }

  const secRegex = /<div class="font-semibold text-foreground leading-tight break-words whitespace-normal">([^<]+)<\/div>/g;
  const sectionsList: { title: string; indexInHtml: number }[] = [];
  while ((m = secRegex.exec(html)) !== null) {
    sectionsList.push({
      title: m[1].replace(/&amp;/g, '&').trim(),
      indexInHtml: m.index,
    });
  }

  let globalOrder = 1;
  const structuredSections = sectionsList.map((sec, sIdx) => {
    const nextIndex = sIdx + 1 < sectionsList.length ? sectionsList[sIdx + 1].indexInHtml : Infinity;
    const itemsInSec = allItems.filter(item => item.indexInHtml > sec.indexInHtml && item.indexInHtml < nextIndex);
    const secId = `${courseId}-sec-${sIdx + 1}`;

    const resources = itemsInSec.map((item, rIdx) => {
      const type = inferType(item.title);
      return {
        id: item.chapterId,
        chapterId: item.chapterId,
        sectionId: secId,
        courseId,
        title: item.title,
        resourceType: type,
        officialUrl: 'https://algomaster.io' + item.href,
        orderIndex: globalOrder++,
        sectionOrderIndex: rIdx + 1,
        estimatedMinutes: type === 'quiz' ? 10 : type === 'exercise' ? 20 : type === 'design_problem' ? 30 : 15,
        difficulty: inferDifficulty(item.title, type),
        priority: type === 'design_problem' ? 'High' : 'Normal',
      };
    });

    return {
      id: secId,
      courseId,
      title: sec.title,
      orderIndex: sIdx + 1,
      resources,
    };
  });

  return { sections: structuredSections, totalResources: globalOrder - 1 };
}

export async function runImporter() {
  console.log('🚀 Starting AlgoMaster Curriculum Importer...');
  const coursesResult = [];

  for (const cfg of CONFIG) {
    console.log(`\nFetching ${cfg.name} from ${cfg.sourceUrl}...`);
    try {
      const response = await fetch(cfg.sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const { sections, totalResources } = await extractFromHtml(html, cfg.id);
      console.log(`✔ Extracted ${sections.length} sections and ${totalResources} resources for ${cfg.name}.`);

      coursesResult.push({
        ...cfg,
        totalResources,
        sections,
      });

      // Update Supabase
      console.log(`Syncing ${cfg.name} to Supabase...`);
      await supabase.from('algomaster_courses').upsert({
        id: cfg.id,
        name: cfg.name,
        slug: cfg.slug,
        source: cfg.source,
        source_url: cfg.sourceUrl,
        description: cfg.description,
        total_resources: totalResources,
      });

      for (const sec of sections) {
        await supabase.from('algomaster_sections').upsert({
          id: sec.id,
          course_id: cfg.id,
          title: sec.title,
          order_index: sec.orderIndex,
        });

        const rows = sec.resources.map(r => ({
          id: r.id,
          section_id: sec.id,
          course_id: cfg.id,
          chapter_id: r.chapterId,
          title: r.title,
          resource_type: r.resourceType,
          official_url: r.officialUrl,
          order_index: r.orderIndex,
          estimated_minutes: r.estimatedMinutes,
          difficulty: r.difficulty,
          priority: r.priority,
        }));

        await supabase.from('algomaster_resources').upsert(rows);
      }
    } catch (err) {
      console.error(`Failed to import ${cfg.name}:`, err);
    }
  }

  if (coursesResult.length > 0) {
    const outPath = path.join(process.cwd(), 'src', 'data', 'curriculum.json');
    fs.writeFileSync(outPath, JSON.stringify({ courses: coursesResult }, null, 2));
    console.log(`\n🎉 Successfully refreshed ${outPath}`);
  }

  console.log('\n✅ AlgoMaster Import process finished.');
}

// Execute if run directly
if (require.main === module) {
  runImporter().catch(console.error);
}
