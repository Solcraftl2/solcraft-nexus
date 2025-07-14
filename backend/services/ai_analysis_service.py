"""
Solcraft Nexus - AI Analysis Service
Provides AI-powered asset analysis, market predictions, risk assessment, and portfolio optimization
"""

import os
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage
from .supabase_service import get_supabase_client

class AIAnalysisService:
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.is_available = bool(self.openai_api_key and self.openai_api_key.strip())
        
        if not self.is_available:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("OPENAI_API_KEY not found - AI features will be disabled")
        
        # AI Analysis types
        self.ANALYSIS_TYPES = {
            "asset_analysis": "Detailed asset analysis and valuation",
            "market_prediction": "Market trends and predictions",
            "risk_assessment": "Portfolio risk evaluation",
            "portfolio_optimization": "Investment optimization recommendations"
        }
        
        # Supported asset classes
        self.ASSET_CLASSES = {
            "real_estate": "Real Estate",
            "private_credit": "Private Credit", 
            "commodities": "Commodities",
            "equity_securities": "Equity Securities"
        }

    def is_service_available(self) -> bool:
        """Check if AI service is available (has valid API key)"""
        return self.is_available

    def _check_availability(self):
        """Check if service is available, raise exception if not"""
        if not self.is_available:
            raise ValueError("AI Analysis service is not available - OPENAI_API_KEY not configured")

    def _create_llm_chat(self, session_id: str, system_message: str) -> LlmChat:
        """Create LLM chat instance with OpenAI GPT-4o-mini"""
        chat = LlmChat(
            api_key=self.openai_api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini").with_max_tokens(4096)
        
        return chat

    async def analyze_asset(
        self,
        asset_data: Dict[str, Any],
        analysis_type: str = "comprehensive",
        language: str = "en"
    ) -> Dict[str, Any]:
        """Analyze a specific asset using AI"""
        
        self._check_availability()
        
        session_id = f"asset_analysis_{uuid.uuid4().hex[:8]}"
        
        # Create system message for asset analysis
        system_message = self._get_asset_analysis_system_message(language)
        
        # Create chat instance
        chat = self._create_llm_chat(session_id, system_message)
        
        # Prepare asset data for analysis
        asset_prompt = self._build_asset_analysis_prompt(asset_data, analysis_type, language)
        
        # Send message to AI
        user_message = UserMessage(text=asset_prompt)
        ai_response = await chat.send_message(user_message)
        
        # Store analysis in database
        analysis_record = await self._store_ai_analysis(
            session_id=session_id,
            analysis_type="asset_analysis",
            input_data=asset_data,
            ai_response=ai_response,
            language=language
        )
        
        return {
            "analysis_id": analysis_record["id"],
            "asset_name": asset_data.get("name", "Unknown Asset"),
            "analysis_type": "asset_analysis",
            "ai_insights": ai_response,
            "timestamp": datetime.now().isoformat(),
            "language": language
        }

    async def predict_market_trends(
        self,
        asset_class: str,
        time_horizon: str = "3_months",
        language: str = "en"
    ) -> Dict[str, Any]:
        """Generate market predictions for specific asset class"""
        
        self._check_availability()
        
        session_id = f"market_prediction_{uuid.uuid4().hex[:8]}"
        
        # Create system message for market prediction
        system_message = self._get_market_prediction_system_message(language)
        
        # Create chat instance
        chat = self._create_llm_chat(session_id, system_message)
        
        # Build market prediction prompt
        market_prompt = self._build_market_prediction_prompt(asset_class, time_horizon, language)
        
        # Send message to AI
        user_message = UserMessage(text=market_prompt)
        ai_response = await chat.send_message(user_message)
        
        # Store analysis in database
        analysis_record = await self._store_ai_analysis(
            session_id=session_id,
            analysis_type="market_prediction",
            input_data={"asset_class": asset_class, "time_horizon": time_horizon},
            ai_response=ai_response,
            language=language
        )
        
        return {
            "analysis_id": analysis_record["id"],
            "asset_class": asset_class,
            "time_horizon": time_horizon,
            "analysis_type": "market_prediction",
            "ai_insights": ai_response,
            "timestamp": datetime.now().isoformat(),
            "language": language
        }

    async def assess_portfolio_risk(
        self,
        portfolio_data: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        """Assess portfolio risk using AI analysis"""
        
        self._check_availability()
        
        session_id = f"risk_assessment_{uuid.uuid4().hex[:8]}"
        
        # Create system message for risk assessment
        system_message = self._get_risk_assessment_system_message(language)
        
        # Create chat instance
        chat = self._create_llm_chat(session_id, system_message)
        
        # Build risk assessment prompt
        risk_prompt = self._build_risk_assessment_prompt(portfolio_data, language)
        
        # Send message to AI
        user_message = UserMessage(text=risk_prompt)
        ai_response = await chat.send_message(user_message)
        
        # Store analysis in database
        analysis_record = await self._store_ai_analysis(
            session_id=session_id,
            analysis_type="risk_assessment",
            input_data=portfolio_data,
            ai_response=ai_response,
            language=language
        )
        
        return {
            "analysis_id": analysis_record["id"],
            "portfolio_value": portfolio_data.get("total_value", 0),
            "analysis_type": "risk_assessment",
            "ai_insights": ai_response,
            "timestamp": datetime.now().isoformat(),
            "language": language
        }

    async def optimize_portfolio(
        self,
        portfolio_data: Dict[str, Any],
        optimization_goals: List[str],
        language: str = "en"
    ) -> Dict[str, Any]:
        """Generate portfolio optimization recommendations"""
        
        self._check_availability()
        
        session_id = f"portfolio_optimization_{uuid.uuid4().hex[:8]}"
        
        # Create system message for portfolio optimization
        system_message = self._get_portfolio_optimization_system_message(language)
        
        # Create chat instance
        chat = self._create_llm_chat(session_id, system_message)
        
        # Build optimization prompt
        optimization_prompt = self._build_portfolio_optimization_prompt(
            portfolio_data, optimization_goals, language
        )
        
        # Send message to AI
        user_message = UserMessage(text=optimization_prompt)
        ai_response = await chat.send_message(user_message)
        
        # Store analysis in database
        analysis_record = await self._store_ai_analysis(
            session_id=session_id,
            analysis_type="portfolio_optimization",
            input_data={"portfolio": portfolio_data, "goals": optimization_goals},
            ai_response=ai_response,
            language=language
        )
        
        return {
            "analysis_id": analysis_record["id"],
            "optimization_goals": optimization_goals,
            "analysis_type": "portfolio_optimization",
            "ai_insights": ai_response,
            "timestamp": datetime.now().isoformat(),
            "language": language
        }

    def _get_asset_analysis_system_message(self, language: str) -> str:
        """Get system message for asset analysis"""
        if language == "it":
            return """Sei un esperto analista finanziario specializzato in asset tokenizzati e Real World Assets (RWA). 
            Fornisci analisi dettagliate e professionali di asset immobiliari, credito privato, commodities e titoli azionari.
            Usa terminologia finanziaria professionale e fornisci insights actionable per investitori istituzionali.
            Struttura sempre le tue risposte in modo chiaro con valutazioni, rischi, opportunità e raccomandazioni."""
        else:
            return """You are an expert financial analyst specializing in tokenized assets and Real World Assets (RWA).
            Provide detailed and professional analysis of real estate, private credit, commodities, and equity securities.
            Use professional financial terminology and provide actionable insights for institutional investors.
            Always structure your responses clearly with valuations, risks, opportunities, and recommendations."""

    def _get_market_prediction_system_message(self, language: str) -> str:
        """Get system message for market predictions"""
        if language == "it":
            return """Sei un analista di mercato senior specializzato in previsioni di mercato per asset tokenizzati.
            Fornisci previsioni basate su analisi tecnica, fondamentale e sentiment di mercato.
            Includi sempre scenario ottimistico, realistico e pessimistico con probabilità associate.
            Basa le tue previsioni su trend attuali, indicatori economici e fattori geopolitici."""
        else:
            return """You are a senior market analyst specializing in market predictions for tokenized assets.
            Provide forecasts based on technical, fundamental, and market sentiment analysis.
            Always include optimistic, realistic, and pessimistic scenarios with associated probabilities.
            Base your predictions on current trends, economic indicators, and geopolitical factors."""

    def _get_risk_assessment_system_message(self, language: str) -> str:
        """Get system message for risk assessment"""
        if language == "it":
            return """Sei un esperto di gestione del rischio per investimenti in asset tokenizzati.
            Valuta concentrazione, correlazione, liquidità, volatilità e rischi normativi del portfolio.
            Fornisci un risk score da 1-10 e raccomandazioni specifiche per la mitigazione del rischio.
            Considera sia i rischi tradizionali che quelli specifici della tokenizzazione."""
        else:
            return """You are a risk management expert for tokenized asset investments.
            Assess concentration, correlation, liquidity, volatility, and regulatory risks in the portfolio.
            Provide a risk score from 1-10 and specific recommendations for risk mitigation.
            Consider both traditional risks and tokenization-specific risks."""

    def _get_portfolio_optimization_system_message(self, language: str) -> str:
        """Get system message for portfolio optimization"""
        if language == "it":
            return """Sei un consulente di investimenti specializzato nell'ottimizzazione di portfolio di asset tokenizzati.
            Fornisci raccomandazioni per ribilanciamento, diversificazione e allocazione asset.
            Considera obiettivi di rendimento, tolleranza al rischio e orizzonte temporale dell'investitore.
            Includi allocation percentuali specifiche e strategie di entry/exit."""
        else:
            return """You are an investment advisor specializing in tokenized asset portfolio optimization.
            Provide recommendations for rebalancing, diversification, and asset allocation.
            Consider return objectives, risk tolerance, and investor time horizon.
            Include specific percentage allocations and entry/exit strategies."""

    def _build_asset_analysis_prompt(self, asset_data: Dict[str, Any], analysis_type: str, language: str) -> str:
        """Build prompt for asset analysis"""
        
        asset_info = f"""
        Asset Name: {asset_data.get('name', 'N/A')}
        Asset Type: {asset_data.get('type', 'N/A')}
        Current Value: ${asset_data.get('value', 0):,}
        Location: {asset_data.get('location', 'N/A')}
        Description: {asset_data.get('description', 'N/A')}
        Historical Performance: {asset_data.get('performance', 'N/A')}
        Market Data: {asset_data.get('market_data', 'N/A')}
        """
        
        if language == "it":
            return f"""Analizza questo asset tokenizzato e fornisci un'analisi completa:

            {asset_info}

            Fornisci un'analisi strutturata che includa:
            1. Valutazione del prezzo attuale (fair value)
            2. Analisi dei rischi specifici
            3. Potenziale di crescita e rendimento
            4. Comparazione con asset simili
            5. Raccomandazioni di investimento (BUY/HOLD/SELL)
            6. Orizzonte temporale ottimale

            Usa dati di mercato attuali e considera fattori macroeconomici."""
        else:
            return f"""Analyze this tokenized asset and provide a comprehensive analysis:

            {asset_info}

            Provide a structured analysis including:
            1. Current price valuation (fair value assessment)
            2. Specific risk analysis
            3. Growth potential and yield expectations
            4. Comparison with similar assets
            5. Investment recommendation (BUY/HOLD/SELL)
            6. Optimal time horizon

            Use current market data and consider macroeconomic factors."""

    def _build_market_prediction_prompt(self, asset_class: str, time_horizon: str, language: str) -> str:
        """Build prompt for market predictions"""
        
        if language == "it":
            return f"""Fornisci previsioni di mercato per la classe di asset: {asset_class}
            
            Orizzonte temporale: {time_horizon}
            
            Includi:
            1. Scenario ottimistico (probabilità %)
            2. Scenario realistico (probabilità %)
            3. Scenario pessimistico (probabilità %)
            4. Fattori chiave che influenzeranno il mercato
            5. Catalizzatori potenziali (positivi e negativi)
            6. Raccomandazioni strategiche per questo periodo
            
            Considera trend attuali, indicatori economici, geopolitica e adozione della tokenizzazione."""
        else:
            return f"""Provide market predictions for asset class: {asset_class}
            
            Time horizon: {time_horizon}
            
            Include:
            1. Optimistic scenario (probability %)
            2. Realistic scenario (probability %)
            3. Pessimistic scenario (probability %)
            4. Key factors that will influence the market
            5. Potential catalysts (positive and negative)
            6. Strategic recommendations for this period
            
            Consider current trends, economic indicators, geopolitics, and tokenization adoption."""

    def _build_risk_assessment_prompt(self, portfolio_data: Dict[str, Any], language: str) -> str:
        """Build prompt for risk assessment"""
        
        portfolio_info = f"""
        Total Portfolio Value: ${portfolio_data.get('total_value', 0):,}
        Number of Assets: {len(portfolio_data.get('assets', []))}
        Asset Allocation: {portfolio_data.get('allocation', {})}
        Geographic Distribution: {portfolio_data.get('geographic_distribution', {})}
        Sector Distribution: {portfolio_data.get('sector_distribution', {})}
        """
        
        if language == "it":
            return f"""Valuta i rischi di questo portfolio di asset tokenizzati:

            {portfolio_info}

            Fornisci:
            1. Risk Score complessivo (1-10, dove 10 = massimo rischio)
            2. Analisi di concentrazione
            3. Rischi di correlazione tra asset
            4. Rischi di liquidità
            5. Rischi normativi e di compliance
            6. Rischi specifici della tokenizzazione
            7. Raccomandazioni per la mitigazione del rischio
            8. Stress testing scenarios

            Considera sia rischi tradizionali che emergenti."""
        else:
            return f"""Assess the risks of this tokenized asset portfolio:

            {portfolio_info}

            Provide:
            1. Overall Risk Score (1-10, where 10 = maximum risk)
            2. Concentration analysis
            3. Asset correlation risks
            4. Liquidity risks
            5. Regulatory and compliance risks
            6. Tokenization-specific risks
            7. Risk mitigation recommendations
            8. Stress testing scenarios

            Consider both traditional and emerging risks."""

    def _build_portfolio_optimization_prompt(self, portfolio_data: Dict[str, Any], goals: List[str], language: str) -> str:
        """Build prompt for portfolio optimization"""
        
        portfolio_info = f"""
        Current Portfolio Value: ${portfolio_data.get('total_value', 0):,}
        Current Allocation: {portfolio_data.get('allocation', {})}
        Performance Metrics: {portfolio_data.get('performance', {})}
        Risk Profile: {portfolio_data.get('risk_profile', 'Moderate')}
        Investment Goals: {', '.join(goals)}
        """
        
        if language == "it":
            return f"""Ottimizza questo portfolio di asset tokenizzati:

            {portfolio_info}

            Fornisci raccomandazioni specifiche per:
            1. Ribilanciamento delle allocation percentuali
            2. Asset da aumentare/ridurre/eliminare
            3. Nuovi asset da considerare
            4. Strategia di diversificazione geografica/settoriale
            5. Timing delle modifiche (priorità)
            6. Expected return e risk-adjusted performance
            7. Strategie di entry/exit per ogni modifica
            8. Considerazioni fiscali e di costo

            Obiettivi: {', '.join(goals)}"""
        else:
            return f"""Optimize this tokenized asset portfolio:

            {portfolio_info}

            Provide specific recommendations for:
            1. Rebalancing percentage allocations
            2. Assets to increase/reduce/eliminate
            3. New assets to consider
            4. Geographic/sector diversification strategy
            5. Timing of changes (priority order)
            6. Expected return and risk-adjusted performance
            7. Entry/exit strategies for each change
            8. Tax and cost considerations

            Goals: {', '.join(goals)}"""

    async def _store_ai_analysis(
        self,
        session_id: str,
        analysis_type: str,
        input_data: Dict[str, Any],
        ai_response: str,
        language: str
    ) -> Dict[str, Any]:
        """Store AI analysis in database"""
        
        supabase = get_supabase_client()
        
        analysis_data = {
            "session_id": session_id,
            "analysis_type": analysis_type,
            "input_data": input_data,
            "ai_response": ai_response,
            "language": language,
            "model": "gpt-4o-mini",
            "provider": "openai",
            "created_at": datetime.now().isoformat()
        }
        
        try:
            result = supabase.table("ai_analyses").insert(analysis_data).execute()
            return result.data[0] if result.data else {"id": session_id}
        except Exception as e:
            # If table doesn't exist, return mock response
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not store AI analysis (table may not exist): {str(e)}")
            return {"id": session_id, **analysis_data}

    def get_analysis_types(self) -> Dict[str, str]:
        """Get available analysis types"""
        return self.ANALYSIS_TYPES

    def get_supported_asset_classes(self) -> Dict[str, str]:
        """Get supported asset classes"""
        return self.ASSET_CLASSES

# Global service instance
ai_analysis_service = AIAnalysisService()