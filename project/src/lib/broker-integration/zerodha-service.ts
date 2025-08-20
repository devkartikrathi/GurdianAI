import { KiteConnect } from 'kiteconnect-ts'

export interface ZerodhaCredentials {
  apiKey: string
  apiSecret: string
  accessToken?: string
  userId?: string
}

export interface ZerodhaTrade {
  tradeId: string
  symbol: string
  tradeType: 'BUY' | 'SELL'
  quantity: number
  price: number
  tradeDatetime: Date
  orderId: string
  exchange: string
}

export interface ZerodhaPosition {
  symbol: string
  quantity: number
  averagePrice: number
  lastPrice: number
  pnl: number
  exchange: string
}

export interface ZerodhaProfile {
  userId: string
  userName: string
  email: string
  broker: string
}

export interface ZerodhaSession {
  accessToken: string
  profile: ZerodhaProfile
  expiresAt: Date
}

export class ZerodhaService {
  private kite: KiteConnect

  private credentials: ZerodhaCredentials
  private isConnected: boolean = false

  constructor(credentials: ZerodhaCredentials) {
    this.credentials = credentials
    this.kite = new KiteConnect({
      api_key: credentials.apiKey,
      access_token: credentials.accessToken || undefined
    })
  }

  /**
   * Generate login URL for OAuth flow
   */
  generateLoginUrl(): string {
    return this.kite.getLoginURL()
  }

  /**
   * Generate session using request token
   */
  async generateSession(requestToken: string): Promise<ZerodhaSession> {
    try {
      const response = await this.kite.generateSession(requestToken, this.credentials.apiSecret)

      // Set the access token for future API calls
      this.kite.setAccessToken(response.access_token)

      // Get user profile
      const profile = await this.kite.getProfile()

      // Calculate expiration time (Zerodha tokens expire daily at 6:00 AM IST)
      const expiresAt = this.calculateTokenExpiry()

      return {
        accessToken: response.access_token,
        profile: {
          userId: profile.user_id,
          userName: profile.user_name,
          email: profile.email,
          broker: 'zerodha'
        },
        expiresAt
      }
    } catch (error) {
      console.error('Error generating Zerodha session:', error)
      throw new Error(`Failed to generate session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Set access token for existing session
   */
  setAccessToken(accessToken: string): void {
    this.credentials.accessToken = accessToken
    this.kite.setAccessToken(accessToken)
  }

  /**
   * Test connection by fetching user profile
   */
  async testConnection(): Promise<ZerodhaProfile> {
    try {
      if (!this.credentials.accessToken) {
        throw new Error('No access token available. Please complete OAuth authentication first.')
      }

      const profile = await this.kite.getProfile()

      return {
        userId: profile.user_id,
        userName: profile.user_name,
        email: profile.email,
        broker: 'zerodha'
      }
    } catch (error) {
      console.error('Error testing Zerodha connection:', error)
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetch today's trades
   */
  async fetchTodaysTrades(): Promise<ZerodhaTrade[]> {
    try {
      if (!this.credentials.accessToken) {
        throw new Error('No access token available. Please complete OAuth authentication first.')
      }

      const trades = await this.kite.getTrades()

      return trades.map(trade => ({
        tradeId: trade.trade_id?.toString() || '',
        symbol: trade.tradingsymbol || '',
        tradeType: trade.transaction_type as 'BUY' | 'SELL',
        quantity: parseInt(trade.quantity?.toString() || '0'),
        price: parseFloat(trade.average_price?.toString() || '0'),
        tradeDatetime: new Date(trade.exchange_timestamp || trade.order_timestamp || ''),
        orderId: trade.order_id?.toString() || '',
        exchange: trade.exchange || ''
      }))
    } catch (error) {
      console.error('Error fetching Zerodha trades:', error)
      throw new Error(`Failed to fetch trades: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetch current positions
   */
  async fetchPositions(): Promise<ZerodhaPosition[]> {
    try {
      if (!this.credentials.accessToken) {
        throw new Error('No access token available. Please complete OAuth authentication first.')
      }

      const positions = await this.kite.getPositions()
      const netPositions = positions.net || []

      return netPositions.map(position => ({
        symbol: position.tradingsymbol || '',
        quantity: parseInt(position.quantity?.toString() || '0'),
        averagePrice: parseFloat(position.average_price?.toString() || '0'),
        lastPrice: parseFloat(position.last_price?.toString() || '0'),
        pnl: parseFloat(position.pnl?.toString() || '0'),
        exchange: position.exchange || ''
      }))
    } catch (error) {
      console.error('Error fetching Zerodha positions:', error)
      throw new Error(`Failed to fetch positions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetch current holdings
   */
  async fetchHoldings(): Promise<any[]> {
    try {
      if (!this.credentials.accessToken) {
        throw new Error('No access token available. Please complete OAuth authentication first.')
      }

      return await this.kite.getHoldings()
    } catch (error) {
      console.error('Error fetching Zerodha holdings:', error)
      throw new Error(`Failed to fetch holdings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }



  /**
   * Fetch historical data for a specific instrument
   */
  async fetchHistoricalData(
    instrumentToken: string,
    interval: "minute" | "day" | "3minute" | "5minute" | "10minute" | "15minute" | "30minute" | "60minute",
    fromDate: Date,
    toDate: Date,
    continuous: boolean = false,
    oi: boolean = false
  ): Promise<any> {
    try {
      if (!this.credentials.accessToken) {
        throw new Error('No access token available. Please complete OAuth authentication first.')
      }

      return await this.kite.getHistoricalData(
        instrumentToken,
        interval,
        fromDate,
        toDate,
        continuous,
        oi
      )
    } catch (error) {
      console.error('Error fetching historical data:', error)
      throw new Error(`Failed to fetch historical data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get market quotes for instruments
   */
  async getQuotes(instruments: string[]): Promise<any> {
    try {
      if (!this.credentials.accessToken) {
        throw new Error('No access token available. Please complete OAuth authentication first.')
      }

      return await this.kite.getQuote(instruments)
    } catch (error) {
      console.error('Error fetching quotes:', error)
      throw new Error(`Failed to fetch quotes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get last traded price for instruments
   */
  async getLTP(instruments: string[]): Promise<any> {
    try {
      if (!this.credentials.accessToken) {
        throw new Error('No access token available. Please complete OAuth authentication first.')
      }

      return await this.kite.getLTP(instruments)
    } catch (error) {
      console.error('Error fetching LTP:', error)
      throw new Error(`Failed to fetch LTP: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate token expiry time (daily at 6:00 AM IST)
   */
  private calculateTokenExpiry(): Date {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(6, 0, 0, 0) // 6:00 AM IST

    return tomorrow
  }

  /**
   * Check if current token is expired
   */
  isTokenExpired(): boolean {
    if (!this.credentials.accessToken) return true

    const now = new Date()
    const expiry = this.calculateTokenExpiry()

    return now >= expiry
  }

  /**
   * Refresh access token if expired
   */
  async refreshToken(): Promise<boolean> {
    try {
      // Note: Zerodha doesn't provide refresh tokens in the standard OAuth flow
      // Users need to re-authenticate daily
      if (this.isTokenExpired()) {
        throw new Error('Token has expired. Please re-authenticate with Zerodha.')
      }

      return true
    } catch (error) {
      console.error('Error refreshing token:', error)
      return false
    }
  }
}

/**
 * Factory function to create Zerodha service instance
 */
export function createZerodhaService(credentials: ZerodhaCredentials): ZerodhaService {
  return new ZerodhaService(credentials)
}

/**
 * Validate Zerodha credentials format
 */
export function validateZerodhaCredentials(credentials: ZerodhaCredentials): boolean {
  return !!(credentials.apiKey && credentials.apiSecret)
}
