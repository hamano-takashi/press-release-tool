/**
 * SCALE PR Competency Model
 * PRパーソンに必要な5つの力を定義
 */

import { SCALEPower, ProposalAngle, AIAnalysisInput } from '@/types'

/**
 * SCALE PR Competency Modelの5つの力の定義
 */
export const SCALE_POWERS: Record<SCALEPower, {
  name: string;
  description: string;
  mindset: string[];
  skills: string[];
  knowledge: string[];
}> = {
  'multi-stakeholder': {
    name: 'マルチ憑依力',
    description: '様々なステークホルダーの視点を理解し、切り替える力',
    mindset: ['フットワークが軽い', '想像力が高い', 'WINWIN発想'],
    skills: ['ステークホルダーの関心領域への把握力', 'ニーズや意図を汲んだ対話力', 'ステークホルダーとのリレーション構築力'],
    knowledge: ['インフルエンサーとメディアの理解', '行政や非営利組織の理解', 'ステークホルダーの歴史'],
  },
  'spokesperson': {
    name: '背負い力',
    description: '会社や商品の代弁者としての意識と責任感',
    mindset: ['会社や商品の代弁者であるという意識', '空気を読める'],
    skills: ['事業/商品戦略への理解力', 'OK/NG境界線の判断力', 'データ活用力'],
    knowledge: ['PRプリンシプルの理解', 'ブランドマネジメントの基本理解', 'PR主体に関する知識'],
  },
  'situational-forecast': {
    name: '見立て力',
    description: '時流を先読みし、状況を予測する力',
    mindset: ['客観的視点', '好奇心があり情報感度が高い', '物事の裏側を推測できる'],
    skills: ['時流を先読みした提言力', 'データ活用力', 'ファクト編集力'],
    knowledge: ['社会情勢やトレンドの知識', '広くバランスの良い業界知識', '編集の知識'],
  },
  'narrative': {
    name: 'ナラティブ力',
    description: 'ストーリーを創造し、伝える力',
    mindset: ['創造的志向', '戦略思考', '右脳と左脳のバランス'],
    skills: ['ストーリーライティングスキル', 'レクチャースキル', 'PRワード開発力'],
    knowledge: ['PESOの理解', 'ストーリー構造の理解', '社会背景やカルチャーの知識'],
  },
  'executional-flexibility': {
    name: '変動実行力',
    description: '変化に対応し、実行する力',
    mindset: ['逆境時のメンタルの強さ', 'ネガティブとポジティブのバランス', '変化を楽しむことができる'],
    skills: ['変化対応力', '危機管理スキル', 'プロジェクトマネジメントスキル'],
    knowledge: ['多様な広報手法の理解', '広報以外の手法の理解', '法律・会計などの知識'],
  },
}

/**
 * アングルに応じたSCALE PRの力をマッピング
 */
export const ANGLE_TO_SCALE_POWERS: Record<ProposalAngle, SCALEPower[]> = {
  'social-issue': ['multi-stakeholder', 'narrative', 'situational-forecast'],
  'trend-aligned': ['situational-forecast', 'narrative', 'multi-stakeholder'],
  'seasonal': ['situational-forecast', 'executional-flexibility', 'narrative'],
  'unique-story': ['narrative', 'spokesperson', 'multi-stakeholder'],
  'industry-innovative': ['spokesperson', 'situational-forecast', 'executional-flexibility'],
}

/**
 * 商品とトレンドの適合性をチェック
 * @param input 商品・サービス情報
 * @param trends トレンドリスト
 * @param angle 提案アングル
 * @returns 適合性スコア（0-100）と適合性判定
 */
export function checkCompatibility(
  input: AIAnalysisInput,
  trends: string[],
  angle: ProposalAngle
): { score: number; isCompatible: boolean; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // 1. 業界とトレンドの関連性チェック（30点）
  if (input.industry && trends.length > 0) {
    const industryKeywords = input.industry.toLowerCase().split(/[、・\s]/)
    const trendMatches = trends.filter(trend => 
      industryKeywords.some(keyword => trend.toLowerCase().includes(keyword))
    )
    if (trendMatches.length > 0) {
      score += 30
      reasons.push(`業界「${input.industry}」とトレンド「${trendMatches[0]}」が関連しています`)
    }
  }

  // 2. 商品説明とトレンドの関連性チェック（30点）
  if (input.description && trends.length > 0) {
    const descriptionKeywords = extractKeywords(input.description)
    const trendMatches = trends.filter(trend => 
      descriptionKeywords.some(keyword => trend.toLowerCase().includes(keyword.toLowerCase()))
    )
    if (trendMatches.length > 0) {
      score += 30
      reasons.push(`商品説明とトレンド「${trendMatches[0]}」が関連しています`)
    }
  }

  // 3. 特徴とトレンドの関連性チェック（20点）
  if (input.features.length > 0 && trends.length > 0) {
    const featureMatches = input.features.filter(feature => 
      trends.some(trend => trend.toLowerCase().includes(feature.toLowerCase().substring(0, 3)))
    )
    if (featureMatches.length > 0) {
      score += 20
      reasons.push(`特徴「${featureMatches[0]}」がトレンドと関連しています`)
    }
  }

  // 4. アングルと商品の適合性チェック（20点）
  const angleCompatibility = checkAngleCompatibility(input, angle)
  score += angleCompatibility.score
  if (angleCompatibility.reason) {
    reasons.push(angleCompatibility.reason)
  }

  // 適合性判定：スコアが30以上の場合に適合と判定（緩和）
  // スコアが低くても、テンプレートベースで生成する場合は提案を表示する
  const isCompatible = score >= 30

  return { score: Math.min(score, 100), isCompatible, reasons }
}

/**
 * アングルと商品の適合性をチェック
 */
function checkAngleCompatibility(
  input: AIAnalysisInput,
  angle: ProposalAngle
): { score: number; reason?: string } {
  switch (angle) {
    case 'social-issue':
      // 社会課題解決型：社会課題に関連するキーワードがあるか
      const socialKeywords = ['社会', '課題', '解決', '貢献', '支援', '環境', '健康', '教育', '貧困']
      if (socialKeywords.some(keyword => 
        input.description.includes(keyword) || 
        input.features.some(f => f.includes(keyword))
      )) {
        return { score: 20, reason: '社会課題解決型のアングルに適合しています' }
      }
      break

    case 'trend-aligned':
      // トレンド連動型：常に適合（トレンド分析結果に基づく）
      return { score: 20, reason: 'トレンド連動型のアングルに適合しています' }

    case 'seasonal':
      // 季節性活用型：季節に関連するキーワードがあるか
      const seasonalKeywords = ['春', '夏', '秋', '冬', '季節', '時期', 'タイミング']
      if (seasonalKeywords.some(keyword => input.description.includes(keyword))) {
        return { score: 20, reason: '季節性活用型のアングルに適合しています' }
      }
      return { score: 10, reason: '季節性は中程度の適合性です' }

    case 'unique-story':
      // ユニークストーリー型：独自性を示すキーワードがあるか
      const uniqueKeywords = ['独自', '新', '初', '革新的', 'ユニーク', '唯一', '初めて']
      if (uniqueKeywords.some(keyword => 
        input.description.includes(keyword) || 
        input.features.some(f => f.includes(keyword))
      )) {
        return { score: 20, reason: 'ユニークストーリー型のアングルに適合しています' }
      }
      break

    case 'industry-innovative':
      // 業界革新型：業界に関連するキーワードがあるか
      if (input.industry) {
        return { score: 20, reason: `業界「${input.industry}」に革新をもたらすアングルに適合しています` }
      }
      break
  }

  return { score: 0 }
}

/**
 * テキストからキーワードを抽出
 */
function extractKeywords(text: string): string[] {
  const commonWords = ['の', 'を', 'に', 'が', 'は', 'と', 'で', 'も', 'から', 'まで', 'です', 'ます', 'する', 'こと']
  const words = text
    .split(/[\s、。！？]/)
    .filter(word => word.length > 1 && !commonWords.includes(word))
    .slice(0, 10)
  return words
}

/**
 * SCALE PRの力に基づいたプロンプトを作成
 */
export function createSCALEPrompt(
  input: AIAnalysisInput,
  angle: ProposalAngle,
  trends: string[],
  scalePowers: SCALEPower[]
): string {
  const powerDescriptions = scalePowers.map(power => {
    const powerInfo = SCALE_POWERS[power]
    return `【${powerInfo.name}】${powerInfo.description}
- マインドセット: ${powerInfo.mindset.join('、')}
- スキル: ${powerInfo.skills.join('、')}
- ナレッジ: ${powerInfo.knowledge.join('、')}`
  }).join('\n\n')

  return `以下のSCALE PR Competency Modelの力を憑依させて、プレスリリース案を作成してください：

${powerDescriptions}

これらの力を活用して、商品・サービスとトレンドを違和感なく組み合わせ、メディアに取り上げられやすい提案を行ってください。
合わないものは提案しないでください。`
}

