import { query } from '../../../../../lib/database';

export async function GET() {
  try {
    const result = await query(`
      SELECT
        l.code,
        l.name,
        l.native_name,
        COUNT(les.id) as lesson_count
      FROM languages l
      LEFT JOIN skills s ON l.id = s.language_id
      LEFT JOIN lessons les ON s.id = les.skill_id
      WHERE l.active = true
      GROUP BY l.id, l.code, l.name, l.native_name
      ORDER BY lesson_count DESC
    `);

    // Map language codes to appropriate flags
    const flagMap = {
      'gheg-al': '🇦🇱', // Albanian flag
      'albanian': '🇦🇱',
      'al': '🇦🇱',
      'gaelic': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Scottish flag
      'scottish': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'irish': '🇮🇪',
      'welsh': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', // Welsh flag
      'basque': '🏴󠁧󠁢󠁥󠁵󠁳󠁿', // Basque flag
      'catalan': '🏴󠁧󠁢󠁣󠁡󠁴󠁿', // Catalonia flag
      'breton': '🇫🇷', // Brittany/France
      'corsican': '🇫🇷', // Corsica/France
      'sardinian': '🇮🇹', // Sardinia/Italy
      'faroese': '🇫🇴', // Faroe Islands
      'icelandic': '🇮🇸',
      'maltese': '🇲🇹',
      'luxembourgish': '🇱🇺'
    };

    // Add flags to the results
    const languagesWithFlags = result.rows.map(language => ({
      ...language,
      flag: flagMap[language.code.toLowerCase()] || flagMap[language.name.toLowerCase()] || '🏛️'
    }));

    return Response.json(languagesWithFlags);
  } catch (error) {
    console.error('Failed to load languages:', error);
    return Response.json({ error: 'Failed to load languages' }, { status: 500 });
  }
}