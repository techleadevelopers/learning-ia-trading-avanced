# NeuralTrade X: Advanced AI Trading Analysis Panel

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0) [![Python Version](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)
 [![Python Version](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)
[![Framework: Flask](https://img.shields.io/badge/Framework-Flask-green.svg)](https://flask.palletsprojects.com/) **NeuralTrade X is a sophisticated, AI-driven trading analysis platform designed for traders and developers seeking an edge in the financial markets, particularly cryptocurrencies like Bitcoin (BTC). It leverages advanced machine learning techniques, comprehensive technical analysis, and a flexible strategy engine to generate actionable trading signals.**

This platform moves beyond simple indicator crossovers, employing a multi-faceted approach that combines various data points to produce high-confidence trading signals. It provides tools for strategy creation, rigorous backtesting, and simulated paper trading within a user-friendly web interface.

---

## Table of Contents

1.  [Core Concepts](#core-concepts)
2.  [Key Features](#key-features)
3.  [How it Works: The `AdvancedAnalyzer`](#how-it-works-the-advancedanalyzer)
4.  [Technology Stack](#technology-stack)
5.  [Project Structure](#project-structure)
6.  [Installation](#installation)
7.  [Configuration](#configuration)
8.  [Usage](#usage)
9.  [Contributing](#contributing)
10. [License](#license)
11. [Disclaimer](#disclaimer)
12. [Contact](#contact)

---

## Core Concepts

NeuralTrade X is built upon several key principles:

* **Multi-Factor Analysis:** Trading decisions are rarely based on a single data point. NeuralTrade X integrates multiple sources of information, including technical indicators, candlestick patterns, and potentially sentiment and on-chain data, for a holistic market view.
* **AI-Powered Insights:** Incorporates prediction models (`prediction_model.py`) to potentially forecast market movements or identify complex patterns beyond traditional analysis. (Note: Specific model implementation details are in `prediction_model.py`).
* **Customizable Strategies:** Users can define their own trading strategies by selecting indicators, patterns, and setting parameters through a flexible JSON configuration stored in the database.
* **Signal Confluence & Confidence:** The system doesn't just generate BUY/SELL signals. It combines evidence from different analyses based on user-defined rules and weights, calculating a *confidence score* for each signal.
* **Rigorous Validation:** Features robust backtesting capabilities (`backtesting.py`) to evaluate strategy performance on historical data before live deployment.
* **Risk-Free Simulation:** Includes a paper trading module (`paper_trade_routes.py`, `PaperTrade` model) to test strategies in real-time market conditions without risking capital.
* **User-Centric Design:** Provides a web interface (Flask-based, inferred) for managing strategies, viewing signals, monitoring trades, and configuring settings.

---

## Key Features

Based on the project structure and `models.py`:

* **👤 User Management:**
    * Secure user registration and login (`User` model, `flask_login`).
    * Management of exchange API keys (`api_key`, `api_secret` fields).
* **📈 Strategy Engine:**
    * Create, manage, and store multiple trading strategies (`TradingStrategy` model).
    * Define complex strategy parameters using JSON (indicators, patterns, combination rules, etc.).
* **🧠 Advanced Analysis (`AdvancedAnalyzer`):**
    * **Technical Indicators:** Calculates a wide range of indicators using the `ta` library (Trend, Momentum, Volume, Volatility). Interprets indicator values into preliminary signals (e.g., RSI oversold -> BUY).
    * **Candlestick Patterns:** Identifies common bullish and bearish candlestick patterns using the `ta` library.
    * **Sentiment Analysis (Placeholder):** Designed to integrate sentiment analysis APIs/libraries (requires implementation in `_analyze_sentiment`).
    * **On-Chain Analysis (Placeholder):** Designed to integrate on-chain data APIs (e.g., for BTC) (requires implementation in `_analyze_on_chain`).
    * **Signal Combination:** Merges signals from different sources based on configurable rules (`combination_rules`) and weights.
    * **Confidence Scoring:** Calculates a confidence level (0.0 to 1.0) for the final generated signal.
    * **Reasoning:** Provides an explanation (`reason`) for why a particular signal was generated based on the rules triggered.
* **📊 Backtesting:**
    * Test strategy performance against historical market data (`backtesting.py`).
    * Store detailed backtest results, including P/L, win rate, total trades (`BacktestResult` model).
* **📉 Paper Trading:**
    * Simulate trades based on generated signals without real funds (`PaperTrade` model).
    * Track open/closed simulated positions and their P/L.
* **🔔 Signal Generation & Storage:**
    * Generates BUY, SELL, or HOLD signals based on strategy analysis (`TradingSignal` model).
    * Stores generated signals with price, confidence, and reason.
* **🖥️ Web Interface:**
    * Routes for managing users, strategies, signals, and paper trades (`routes` directory).
    * Serves static assets (CSS, JS, Images) and templates (`static`, `templates` directories).
* **🔗 Exchange Integration:**
    * Connects to exchanges like Binance via API (`binance_api.py`).
* **💾 Database Persistence:**
    * Uses SQLAlchemy ORM to interact with a database (`database.py`, `models.py`).
    * Likely uses SQLite by default (`instance/neuraltrade.db`).

---

## How it Works: The `AdvancedAnalyzer`

The core intelligence of NeuralTrade X resides in the `AdvancedAnalyzer` class (`models.py`). Here's a breakdown of its process:

1.  **Input:** Receives market data (OHLCV DataFrame) and the specific strategy's parameters (JSON).
2.  **Technical Indicators:** Calculates all indicators specified in the strategy parameters using the `ta` library. It interprets the latest value of each indicator (e.g., RSI < 30) into a raw signal (BUY, SELL, HOLD).
3.  **Candlestick Patterns:** Identifies any candlestick patterns specified in the strategy parameters occurring in the latest data point using the `ta` library. Interprets patterns (e.g., Bullish Engulfing) into raw signals.
4.  **Sentiment/On-Chain (Future):** Executes placeholder functions for sentiment and on-chain analysis if enabled in the strategy parameters. *These need implementation.*
5.  **Signal Combination:** This is the crucial step.
    * It takes all the raw signals generated above (from indicators, patterns, etc.).
    * It evaluates a list of `combination_rules` defined in the strategy parameters. Each rule specifies a `condition` (e.g., `"signal_technical_rsi == 'BUY' AND signal_candle_BULLISH_ENGULFING == True"`), a resulting `signal` (BUY/SELL), and a `weight`.
    * The `_evaluate_condition` method (currently a basic implementation) checks if a rule's condition is met by the raw signals.
    * If a rule is met, its weight is added to the score of its corresponding signal (BUY or SELL).
6.  **Final Output:**
    * Determines the final signal (BUY or SELL) based on which one accumulated the highest total weight. If no rules are met or weights are equal, it might default to HOLD.
    * Calculates a `confidence` score based on the winning signal's weight relative to the total weight of all triggered rules.
    * Constructs a `reason` string explaining which rules contributed to the final signal.
7.  **Signal Generation:** The `generate_trading_signal` function orchestrates this, taking the `AdvancedAnalyzer`'s output and creating/saving a `TradingSignal` record in the database.

---

## Technology Stack

* **Backend:** Python (3.9+)
* **Web Framework:** Flask (Inferred from `flask_login` and project structure)
* **Database ORM:** SQLAlchemy
* **Database:** SQLite (default, inferred from `instance/neuraltrade.db`), potentially configurable for PostgreSQL, MySQL.
* **Data Analysis:** Pandas
* **Technical Analysis:** `ta` library
* **Frontend:** HTML, CSS, JavaScript (served via Flask templates/static files)
* **Dependencies Management:** `pip` (using `pyproject.toml` and `uv.lock`, potentially with `uv`)
* **Environment:** Virtual Environment (`venv`)

---

## Project Structure

.├── instance/│ └── neuraltrade.db      # Default SQLite database file├── routes/               # Flask blueprint routes│ ├── init.py│ ├── paper_trade_routes.py│ ├── signal_routes.py│ ├── strategy_routes.py│ └── user_routes.py├── static/               # Static web assets│ ├── css/│ ├── images/│ └── js/├── templates/            # Flask/Jinja2 HTML templates├── utils/                # Utility modules│ ├── pycache/│ ├── backtesting.py      # Backtesting logic│ ├── binance_api.py      # Binance integration│ ├── prediction_model.py # AI/ML prediction model logic│ └── technical_indicators.py # (Potentially redundant if solely using 'ta' in AdvancedAnalyzer)├── venv/                 # Python virtual environment (should be in .gitignore)├── .gitignore            # Specifies intentionally untracked files├── .replit               # Replit configuration (if used)├── app.py                # Main Flask application entry point (likely)├── config.py             # Application configuration settings├── database.py           # Database setup and SQLAlchemy initialization├── main.py               # Alternative entry point or script runner (likely)├── models.py             # SQLAlchemy database models and AdvancedAnalyzer├── pyproject.toml        # Project metadata and dependencies (PEP 517/518)└── uv.lock               # Lock file for 'uv' package manager (optional)
---

## Installation

Follow these steps to set up NeuralTrade X locally:

1.  **Prerequisites:**
    * Python 3.9 or higher installed.
    * `pip` (Python package installer).
    * Git.

2.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/techleadevelopers/learning-ia-trading-avanced.git](https://github.com/techleadevelopers/learning-ia-trading-avanced.git)
    cd learning-ia-trading-avanced
    ```

3.  **Create and Activate Virtual Environment:**
    ```bash
    python -m venv venv
    # On Windows
    .\venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```

4.  **Install Dependencies:**
    * *(Recommended if using `uv`)*:
        ```bash
        pip install uv
        uv pip install -r requirements.txt # Or uv sync if pyproject.toml is fully configured
        ```
    * *(Using standard `pip`)*: Check `pyproject.toml` for dependencies or if a `requirements.txt` exists:
        ```bash
        pip install -r requirements.txt
        # or potentially:
        # pip install .
        ```
        *Ensure the `ta` library and other necessary packages (Flask, SQLAlchemy, Pandas, Flask-Login, etc.) are installed.*

5.  **Database Setup:**
    * The application likely uses Flask-Migrate or initializes the database automatically. Run the application (see Usage) or look for specific database setup commands (e.g., `flask db init`, `flask db migrate`, `flask db upgrade`). The `instance/neuraltrade.db` file suggests SQLite will be created automatically on first run if configured correctly.

6.  **Configuration:**
    * Copy or rename any example configuration files (e.g., `.env.example` to `.env`, or modify `config.py`).
    * Set necessary environment variables or configuration values in `config.py` (e.g., `SECRET_KEY`, database URI if not SQLite, API keys if needed globally).

---

## Configuration

NeuralTrade X configuration is primarily handled through:

* **`config.py`:** Contains core application settings like the secret key, database connection string, and potentially default settings.
* **Environment Variables:** Sensitive information like API keys might be loaded from environment variables (check `config.py` or `app.py` for loading logic, e.g., using `python-dotenv`).
* **Strategy Parameters (Database):** The core logic of *how* the bot trades is defined within the `parameters` JSON field of the `TradingStrategy` model in the database. This is typically managed via the web interface. Example structure:
    ```json
    {
      "symbol": "BTCUSDT",
      "timeframe": "1h",
      "technical_indicators": [
        {"name": "rsi", "window": 14, "overbought": 70, "oversold": 30},
        {"name": "macd", "window_slow": 26, "window_fast": 12, "window_sign": 9}
      ],
      "candle_patterns": [
        "CDLENGULFING",
        "CDLHAMMER"
      ],
      "sentiment_analysis": {
        "enabled": false,
        "source": "twitter" // Example
      },
      "on_chain_analysis": {
        "enabled": false,
        "metric": "nvt_signal" // Example
      },
      "signal_combination_rules": [
        {"condition": "signal_technical_rsi == 'BUY' AND signal_candle_CDLHAMMER == True", "signal": "BUY", "weight": 1.5},
        {"condition": "signal_technical_rsi == 'SELL'", "signal": "SELL", "weight": 1.0},
        {"condition": "signal_technical_macd_cross_down", "signal": "SELL", "weight": 1.2} // Requires MACD cross logic implementation
      ],
      "confluence_threshold": 0.6 // Example: minimum confidence to consider a signal valid
    }
    ```
* **User API Keys (Database):** Binance (or other exchange) API keys are stored per-user in the `users` table, likely entered via the web UI.

---

## Usage

1.  **Ensure Virtual Environment is Active:**
    ```bash
    # On Windows
    .\venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```

2.  **Run the Application:**
    * Look for the standard Flask run command:
        ```bash
        flask run
        # Or, if using a different runner script:
        # python main.py
        # python app.py
        ```

3.  **Access the Web Interface:**
    * Open your web browser and navigate to the address provided by Flask (usually `http://127.0.0.1:5000` or `http://localhost:5000`).

4.  **Interact with the Panel:**
    * Register a new user account.
    * Log in.
    * Navigate to the Strategies section to create or manage trading strategies (define parameters via the UI).
    * Add your exchange API keys in the user settings/profile section.
    * Run backtests on your created strategies.
    * View generated trading signals.
    * Monitor simulated trades in the Paper Trading section.

---

## Contributing

We welcome contributions to NeuralTrade X! To contribute:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name` or `bugfix/issue-description`.
3.  **Make your changes** and ensure code quality (linting, testing if applicable).
4.  **Commit your changes** with clear and descriptive messages.
5.  **Push your branch** to your fork: `git push origin feature/your-feature-name`.
6.  **Open a Pull Request** against the `main` branch of the original repository.
7.  **Clearly describe** the changes you made and why.

Please adhere to the project's coding style and conventions. Consider adding tests for new functionality.

---

## License

This project is licensed under the **[MIT License](LICENSE)**. ---

## Disclaimer

**Trading financial instruments, including cryptocurrencies, involves significant risk. NeuralTrade X is an analysis tool and does not guarantee profits or prevent losses. Any trading decisions you make based on the signals or information provided by this software are your own responsibility.**

* **Past performance is not indicative of future results.** Backtest results are theoretical and may not reflect actual trading outcomes.
* **Software bugs or errors may occur.** Use this software at your own risk.
* **Market conditions can change rapidly.** Strategies that worked in the past may not work in the future.
* **Never trade with money you cannot afford to lose.**

**The developers of NeuralTrade X assume no liability for any financial losses incurred while using this software.**

---

## Contact

For questions, issues, or suggestions, please:

* Open an issue on the [GitHub Issues page](https://github.com/techleadevelopers/learning-ia-trading-avanced/issues).
* (Optional: Add other contact methods like email or Discord if desired).

---
