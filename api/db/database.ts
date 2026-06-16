import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'archive.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  const createInterviewsTable = `
    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      interviewee TEXT,
      interviewer TEXT,
      interview_date DATE,
      duration INTEGER DEFAULT 0,
      audio_path TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.exec(createInterviewsTable);

  const createSegmentsTable = `
    CREATE TABLE IF NOT EXISTS segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL,
      start_time REAL NOT NULL DEFAULT 0,
      end_time REAL NOT NULL DEFAULT 0,
      text_content TEXT NOT NULL DEFAULT '',
      original_text TEXT NOT NULL DEFAULT '',
      is_edited INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
    )
  `;
  db.exec(createSegmentsTable);

  const createTagsTable = `
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.exec(createTagsTable);

  const createSegmentTagsTable = `
    CREATE TABLE IF NOT EXISTS segment_tags (
      segment_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (segment_id, tag_id),
      FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `;
  db.exec(createSegmentTagsTable);

  const createSegmentsFtsTable = `
    CREATE VIRTUAL TABLE IF NOT EXISTS segments_fts USING fts5(
      text_content,
      content='segments',
      content_rowid='id'
    )
  `;
  db.exec(createSegmentsFtsTable);

  const createIdxSegmentsInterviewId = `
    CREATE INDEX IF NOT EXISTS idx_segments_interview_id ON segments(interview_id)
  `;
  db.exec(createIdxSegmentsInterviewId);

  const createIdxTagsCategory = `
    CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category)
  `;
  db.exec(createIdxTagsCategory);

  const createIdxSegmentTagsTagId = `
    CREATE INDEX IF NOT EXISTS idx_segment_tags_tag_id ON segment_tags(tag_id)
  `;
  db.exec(createIdxSegmentTagsTagId);

  const createIdxInterviewsStatus = `
    CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status)
  `;
  db.exec(createIdxInterviewsStatus);

  seedTags();
  seedSampleData();
}

function seedTags(): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
  if (countRow.count > 0) return;

  const tags = [
    { name: '王德明', category: 'person', color: '#e74c3c' },
    { name: '李秀英', category: 'person', color: '#3498db' },
    { name: '张建国', category: 'person', color: '#9b59b6' },
    { name: '刘芳', category: 'person', color: '#1abc9c' },
    { name: '北京市', category: 'location', color: '#2ecc71' },
    { name: '上海市', category: 'location', color: '#f39c12' },
    { name: '南京市', category: 'location', color: '#e67e22' },
    { name: '广州市', category: 'location', color: '#34495e' },
    { name: '1940年代', category: 'era', color: '#95a5a6' },
    { name: '1950年代', category: 'era', color: '#27ae60' },
    { name: '1960年代', category: 'era', color: '#2980b9' },
    { name: '1970年代', category: 'era', color: '#8e44ad' },
    { name: '1980年代', category: 'era', color: '#d35400' },
    { name: '解放战争', category: 'event', color: '#c0392b' },
    { name: '抗美援朝', category: 'event', color: '#e74c3c' },
    { name: '改革开放', category: 'event', color: '#f1c40f' },
    { name: '恢复高考', category: 'event', color: '#16a085' },
  ];

  const insertStmt = db.prepare('INSERT INTO tags (name, category, color) VALUES (?, ?, ?)');
  const insertMany = db.transaction((tagList: typeof tags) => {
    for (const tag of tagList) {
      insertStmt.run(tag.name, tag.category, tag.color);
    }
  });
  insertMany(tags);
}

function seedSampleData(): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM interviews').get() as { count: number };
  if (countRow.count > 0) return;

  const insertInterview = db.prepare(`
    INSERT INTO interviews (title, interviewee, interviewer, interview_date, duration, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const interview1 = insertInterview.run(
    '王德明老人访谈录 - 我的抗战岁月',
    '王德明',
    '张研究员',
    '2020-03-15',
    3600,
    'completed'
  );

  const interview2 = insertInterview.run(
    '李秀英女士访谈 - 改革开放的记忆',
    '李秀英',
    '李研究员',
    '2021-06-20',
    2400,
    'editing'
  );

  const interview3 = insertInterview.run(
    '张建国口述历史 - 从农村到城市',
    '张建国',
    '王研究员',
    '2022-09-10',
    5400,
    'draft'
  );

  const interviewIds = [interview1.lastInsertRowid as number, interview2.lastInsertRowid as number, interview3.lastInsertRowid as number];

  const insertSegment = db.prepare(`
    INSERT INTO segments (interview_id, start_time, end_time, text_content, original_text, is_edited, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSegmentTag = db.prepare('INSERT INTO segment_tags (segment_id, tag_id) VALUES (?, ?)');

  const sampleSegments1 = [
    { startTime: 0, endTime: 45, text: '我叫王德明，1930年出生在北京市的一个普通家庭。那时候日子很苦，但我们一家人在一起也很快乐。', original: '我叫王德明，1930年出生在北京市的一个普通家庭。那时候日子很苦，但我们一家人在一起也很快乐。', isEdited: 1, tags: [1, 5, 9] },
    { startTime: 45, endTime: 120, text: '1948年的时候，我才18岁，就报名参了军。那时候全国都在打仗，我们年轻人都想着为国家出一份力。', original: '1948年的时候，我才18岁，就报名参了军。那时候全国都在打仗，我们年轻人都想着为国家出一份力。', isEdited: 1, tags: [1, 14, 9] },
    { startTime: 120, endTime: 200, text: '后来抗美援朝战争爆发，我跟着部队去了朝鲜。那里天气很冷，条件很艰苦，但大家的士气都很高。', original: '后来抗美援朝战争爆发，我跟着部队去了朝鲜。那里天气很冷，条件很艰苦，但大家的士气都很高。', isEdited: 1, tags: [1, 15, 10] },
    { startTime: 200, endTime: 280, text: '我还记得有一次战斗，我们连坚守阵地三天三夜，打退了敌人十几次进攻。那天的场景，我一辈子都忘不了。', original: '我还记得有一次战斗，我们连坚守阵地三天三夜，打退了敌人十几次进攻。那天的场景，我一辈子都忘不了。', isEdited: 0, tags: [1, 15] },
    { startTime: 280, endTime: 360, text: '战争结束后，我回到了北京，被分配到一家工厂工作。在那里我认识了我的老伴，我们一起生活了六十多年。', original: '战争结束后，我回到了北京，被分配到一家工厂工作。在那里我认识了我的老伴，我们一起生活了六十多年。', isEdited: 0, tags: [1, 5, 10] },
  ];

  const sampleSegments2 = [
    { startTime: 0, endTime: 60, text: '我是李秀英，1955年生在上海市。我父母都是工人，小时候家里条件一般，但也还过得去。', original: '我是李秀英，1955年生在上海市。我父母都是工人，小时候家里条件一般，但也还过得去。', isEdited: 1, tags: [2, 6, 11] },
    { startTime: 60, endTime: 130, text: '1977年恢复高考的时候，我正在农村插队。听到消息后我特别激动，连夜复习了三个月，最后考上了大学。', original: '1977年恢复高考的时候，我正在农村插队。听到消息后我特别激动，连夜复习了三个月，最后考上了大学。', isEdited: 1, tags: [2, 17, 12] },
    { startTime: 130, endTime: 200, text: '大学毕业以后，改革开放的春风吹遍了大江南北。我们那一代人，真是赶上了好时候，有很多机会。', original: '大学毕业以后，改革开放的春风吹遍了大江南北。我们那一代人，真是赶上了好时候，有很多机会。', isEdited: 1, tags: [2, 16, 13] },
    { startTime: 200, endTime: 280, text: '我后来去了广州工作，在一家外贸公司。那时候深圳刚刚建立经济特区，每天都有新的变化。', original: '我后来去了广州工作，在一家外贸公司。那时候深圳刚刚建立经济特区，每天都有新的变化。', isEdited: 0, tags: [2, 8, 13] },
  ];

  const sampleSegments3 = [
    { startTime: 0, endTime: 50, text: '我叫张建国，1960年出生在南京的一个农村家庭。我是家里的老大，下面还有弟弟妹妹。', original: '我叫张建国，1960年出生在南京的一个农村家庭。我是家里的老大，下面还有弟弟妹妹。', isEdited: 1, tags: [3, 7, 11] },
    { startTime: 50, endTime: 120, text: '小时候家里很穷，经常吃不饱饭。我从小就帮家里干农活，放牛、割草、种地，什么活都干过。', original: '小时候家里很穷，经常吃不饱饭。我从小就帮家里干农活，放牛、割草、种地，什么活都干过。', isEdited: 0, tags: [3, 11] },
    { startTime: 120, endTime: 200, text: '1978年，我参军去了北京。那是我第一次走出农村，第一次看到大城市，心里特别激动。', original: '1978年，我参军去了北京。那是我第一次走出农村，第一次看到大城市，心里特别激动。', isEdited: 0, tags: [3, 5, 12] },
    { startTime: 200, endTime: 280, text: '在部队里我学到了很多东西，也入了党。退伍后我被安排到工厂工作，后来又调到了政府部门。', original: '在部队里我学到了很多东西，也入了党。退伍后我被安排到工厂工作，后来又调到了政府部门。', isEdited: 0, tags: [3, 13] },
    { startTime: 280, endTime: 360, text: '90年代的时候，改革开放深入发展，我也下海经商了。刚开始很难，吃了不少苦，但后来慢慢好起来了。', original: '90年代的时候，改革开放深入发展，我也下海经商了。刚开始很难，吃了不少苦，但后来慢慢好起来了。', isEdited: 0, tags: [3, 16] },
  ];

  const allSegments = [sampleSegments1, sampleSegments2, sampleSegments3];

  for (let i = 0; i < interviewIds.length; i++) {
    const interviewId = interviewIds[i];
    const segments = allSegments[i];

    for (let j = 0; j < segments.length; j++) {
      const seg = segments[j];
      const result = insertSegment.run(
        interviewId,
        seg.startTime,
        seg.endTime,
        seg.text,
        seg.original,
        seg.isEdited,
        j
      );
      const segmentId = result.lastInsertRowid as number;

      for (const tagId of seg.tags) {
        insertSegmentTag.run(segmentId, tagId);
      }
    }
  }

  const updateFts = db.prepare(`
    INSERT INTO segments_fts (rowid, text_content)
    SELECT id, text_content FROM segments
  `);
  updateFts.run();
}

export default db;
