from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
from datetime import datetime
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = SentimentIntensityAnalyzer()

@app.get("/api/history")
def get_history(ticker: str, period: str = "1y", interval: str = "1d"):
    try:
        stock = yf.Ticker(ticker)
        # We need historical data
        hist = stock.history(period=period, interval=interval)
        if hist.empty:
            return []
            
        # Format for lightweight-charts: { time: '2019-04-11', open: 54.51, high: 54.56, low: 53.08, close: 53.12 }
        hist = hist.reset_index()
        time_col = 'Datetime' if 'Datetime' in hist.columns else 'Date'
        
        formatted_data = []
        for _, row in hist.iterrows():
            # lightweight-charts expects Unix timestamp in seconds for intraday, or string 'YYYY-MM-DD' for daily
            if interval in ['1d', '1wk', '1mo']:
                time_val = row[time_col].strftime('%Y-%m-%d')
            else:
                time_val = int(row[time_col].timestamp())
                
            formatted_data.append({
                "time": time_val,
                "open": round(row['Open'], 4),
                "high": round(row['High'], 4),
                "low": round(row['Low'], 4),
                "close": round(row['Close'], 4),
                "volume": int(row['Volume'])
            })
            
        return formatted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/info")
def get_info(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        return {
            "name": info.get("longName", ticker),
            "symbol": ticker,
            "price": info.get("currentPrice", "N/A"),
            "currency": info.get("currency", "USD"),
            "changePercent": None # We can calculate this on the frontend, or pass if yfinance provides regularMarketChangePercent
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news")
def get_news(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        news_items = stock.news
        
        formatted_news = []
        agg_sentiment = 0.0
        parsed_count = 0
        
        for item in news_items[:10]:
            article = item.get('content', item)
            title = article.get('title', 'No Title')
            
            provider = article.get('provider', {})
            publisher = provider.get('displayName', 'Unknown Publisher')
            
            click_through = article.get('clickThroughUrl')
            canonical = article.get('canonicalUrl')
            
            link = '#'
            if click_through and isinstance(click_through, dict):
                link = click_through.get('url', '#')
            elif canonical and isinstance(canonical, dict):
                link = canonical.get('url', '#')
                
            pub_date = article.get('pubDate', '')
            
            scores = analyzer.polarity_scores(title)
            compound = scores['compound']
            
            agg_sentiment += compound
            parsed_count += 1
            
            if compound >= 0.05:
                sentiment = "Good News"
            elif compound <= -0.05:
                sentiment = "Bad News"
            else:
                sentiment = "Neutral"
                
            formatted_news.append({
                "title": title,
                "publisher": publisher,
                "link": link,
                "pubDate": pub_date,
                "sentiment": sentiment,
                "score": round(compound, 2)
            })
            
        avg_score = agg_sentiment / parsed_count if parsed_count > 0 else 0
        overall_sentiment = "Neutral"
        if avg_score >= 0.15: overall_sentiment = "Positive"
        elif avg_score <= -0.15: overall_sentiment = "Negative"
        
        return {
            "articles": formatted_news,
            "averageScore": round(avg_score, 2),
            "overallSentiment": overall_sentiment
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
