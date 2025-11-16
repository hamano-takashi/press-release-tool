/**
 * NewsAPI連携
 * 最新のニュースとトレンドを取得するための関数
 */

interface NewsArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: {
    name: string
  }
}

interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: NewsArticle[]
}

/**
 * NewsAPIからニュースを取得
 * @param query - 検索クエリ
 * @param language - 言語（デフォルト: ja）
 * @param sortBy - ソート方法（デフォルト: publishedAt）
 * @param timeout - タイムアウト時間（ミリ秒、デフォルト: 5000）
 */
export async function fetchNews(
  query: string,
  language: string = 'ja',
  sortBy: string = 'publishedAt',
  timeout: number = 5000
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY

  if (!apiKey) {
    console.warn('NEWS_API_KEYが設定されていません。モックデータを返します。')
    return getMockNews(query)
  }

  try {
    // NewsAPIのエンドポイント（無料プランは日本国内のニュースのみ）
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${language}&sortBy=${sortBy}&pageSize=10&apiKey=${apiKey}`

    // タイムアウト処理
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // レート制限や認証エラーの場合
        if (response.status === 429) {
          console.warn('NewsAPI: レート制限に達しました。モックデータを返します。')
          return getMockNews(query)
        }
        if (response.status === 401) {
          console.warn('NewsAPI: 認証エラーが発生しました。モックデータを返します。')
          return getMockNews(query)
        }
        throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`)
      }

      const data: NewsAPIResponse = await response.json()

      if (data.status === 'ok' && data.articles) {
        // 記事が空の場合はモックデータを返す
        if (data.articles.length === 0) {
          console.warn('NewsAPI: 記事が見つかりませんでした。モックデータを返します。')
          return getMockNews(query)
        }
        return data.articles
      }

      // statusが'ok'でない場合
      if (data.status === 'error') {
        console.warn(`NewsAPI: ${data.status} - モックデータを返します。`)
        return getMockNews(query)
      }

      return []
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.warn('NewsAPI: タイムアウトが発生しました。モックデータを返します。')
        return getMockNews(query)
      }
      throw fetchError
    }
  } catch (error) {
    console.error('Failed to fetch news:', error)
    // エラー時はモックデータを返す
    return getMockNews(query)
  }
}

/**
 * トレンドキーワードからニュースを取得
 * @param keywords - 検索キーワードの配列
 * @param maxKeywords - 最大検索キーワード数（デフォルト: 3）
 */
export async function fetchTrendingNews(
  keywords: string[],
  maxKeywords: number = 3
): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = []

  // 最大3つのキーワードで検索（並列処理で高速化）
  const searchPromises = keywords.slice(0, maxKeywords).map((keyword) => fetchNews(keyword))
  
  try {
    const results = await Promise.allSettled(searchPromises)
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value)
      } else {
        console.warn('Failed to fetch news for keyword:', result.reason)
      }
    })
  } catch (error) {
    console.error('Error fetching trending news:', error)
  }

  // 重複を除去（URLベース）
  const uniqueArticles = allArticles.filter(
    (article, index, self) => index === self.findIndex((a) => a.url === article.url)
  )

  // 記事が見つからない場合はモックデータを返す
  if (uniqueArticles.length === 0) {
    return getMockNews(keywords[0] || 'トレンド')
  }

  return uniqueArticles.slice(0, 20) // 最大20件
}

/**
 * 業界に関連するニュースを取得
 */
export async function fetchIndustryNews(industry: string): Promise<NewsArticle[]> {
  if (!industry) {
    return []
  }

  // 業界に関連するキーワードを生成
  const keywords = [
    industry,
    `${industry} ニュース`,
    `${industry} トレンド`,
  ]

  return fetchTrendingNews(keywords)
}

/**
 * モックニュースデータ（APIキーがない場合やエラー時）
 */
function getMockNews(query: string): NewsArticle[] {
  const mockArticles: NewsArticle[] = [
    {
      title: `${query}に関する最新動向`,
      description: `${query}の市場動向と最新情報について`,
      url: 'https://example.com/news/1',
      publishedAt: new Date().toISOString(),
      source: { name: 'サンプルニュース' },
    },
    {
      title: `${query}の成長が期待される`,
      description: `${query}分野での成長が見込まれています`,
      url: 'https://example.com/news/2',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      source: { name: 'サンプルニュース' },
    },
  ]

  return mockArticles
}

/**
 * ニュースからトレンドキーワードを抽出
 */
export function extractTrendsFromNews(articles: NewsArticle[]): string[] {
  // シンプルな実装：記事タイトルからキーワードを抽出
  const trends: string[] = []
  const commonWords = ['の', 'を', 'に', 'が', 'は', 'と', 'で', 'も', 'から', 'まで']

  articles.forEach((article) => {
    const words = article.title
      .split(/[\s、。]/)
      .filter((word) => word.length > 2 && !commonWords.includes(word))
    trends.push(...words.slice(0, 3)) // 各記事から最大3つのキーワード
  })

  // 重複を除去
  return Array.from(new Set(trends)).slice(0, 10)
}

