from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import requests
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

def get_yf_session():
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    })
    return session

@app.get("/api/history")
def get_history(response: Response, ticker: str, period: str = "1y", interval: str = "1d"):
    response.headers["Cache-Control"] = "public, s-maxage=300, stale-while-revalidate=600"
    try:
        url = f"https://query2.finance.yahoo.com/v8/finance/chart/{ticker}?range={period}&interval={interval}"
        session = get_yf_session()
        res = session.get(url, timeout=10)
        
        if res.status_code != 200:
            raise Exception(f"Yahoo API returned {res.status_code}: {res.text}")
            
        data = res.json()
        result = data.get("chart", {}).get("result", [])
        
        if not result:
            return []
            
        chart_data = result[0]
        timestamps = chart_data.get("timestamp", [])
        quote = chart_data.get("indicators", {}).get("quote", [{}])[0]
        
        formatted_data = []
        
        for i in range(len(timestamps)):
            # If any crucial data point is null, skip
            if quote.get("open")[i] is None or quote.get("close")[i] is None:
                continue
                
            time_val = timestamps[i]
            # If interval is daily or longer, lightweight-charts wants 'YYYY-MM-DD'
            if interval in ['1d', '5d', '1wk', '1mo', '3mo']:
                time_val = datetime.fromtimestamp(time_val).strftime('%Y-%m-%d')
                
            formatted_data.append({
                "time": time_val,
                "open": round(quote.get("open")[i], 4),
                "high": round(quote.get("high")[i], 4),
                "low": round(quote.get("low")[i], 4),
                "close": round(quote.get("close")[i], 4),
                "volume": int(quote.get("volume")[i] or 0)
            })
            
        return formatted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/info")
def get_info(ticker: str, response: Response):
    response.headers["Cache-Control"] = "public, s-maxage=300, stale-while-revalidate=600"
    try:
        url = f"https://query2.finance.yahoo.com/v7/finance/quote?symbols={ticker}"
        session = get_yf_session()
        res = session.get(url, timeout=10)
        
        if res.status_code != 200:
            raise Exception(f"Yahoo API returned {res.status_code}: {res.text}")
            
        data = res.json()
        result = data.get("quoteResponse", {}).get("result", [])
        
        if not result:
             return {
                "name": ticker,
                "symbol": ticker,
                "price": "N/A",
                "currency": "USD",
                "changePercent": None
            }
            
        info = result[0]
        return {
            "name": info.get("longName", info.get("shortName", ticker)),
            "symbol": ticker,
            "price": info.get("regularMarketPrice", "N/A"),
            "currency": info.get("currency", "USD"),
            "changePercent": info.get("regularMarketChangePercent", None)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news")
def get_news(ticker: str, response: Response):
    response.headers["Cache-Control"] = "public, s-maxage=300, stale-while-revalidate=600"
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={ticker}&newsCount=10"
        session = get_yf_session()
        res = session.get(url, timeout=10)
        
        if res.status_code != 200:
            raise Exception(f"Yahoo API returned {res.status_code}: {res.text}")
            
        data = res.json()
        news_items = data.get("news", [])
        
        formatted_news = []
        agg_sentiment = 0.0
        parsed_count = 0
        
        for item in news_items:
            title = item.get('title', 'No Title')
            publisher = item.get('publisher', 'Unknown Publisher')
            link = item.get('link', '#')
            
            # PubDate in search API is usually a unix timestamp
            pub_date_raw = item.get('providerPublishTime', '')
            pub_date = ''
            if pub_date_raw:
                try:
                    pub_date = datetime.fromtimestamp(int(pub_date_raw)).strftime('%Y-%m-%d %H:%M')
                except:
                    pass
            
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
