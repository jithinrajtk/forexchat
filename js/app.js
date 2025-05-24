/**
 * SpiderForex Chat Interface
 * Premium Apple Design System Implementation
 */
class ChatInterface {
  constructor() {
    // DOM Elements
    this.messagesContainer = document.getElementById('messagesContainer');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.typingIndicator = document.getElementById('typingIndicator');
    this.refreshButton = document.getElementById('refreshButton');
    
    // Templates
    this.welcomeTemplate = document.getElementById('template-welcome');
    this.userMessageTemplate = document.getElementById('template-user-message');
    this.assistantMessageTemplate = document.getElementById('template-assistant-message');
    this.calculationTemplate = document.getElementById('template-calculation-card');
    
    // State
    this.currentState = 'welcome';
    this.selectedPair = null;
    this.entryPrice = null;
    this.lotSize = 1;
    this.lastMessageType = null;
    this.lastMessageTimestamp = null;
    
    // Initialize
    if (!this.messagesContainer || !this.messageInput || !this.sendButton) {
      console.error('Required chat elements not found');
      return;
    }

    // Setup and start
    this.setupEventListeners();
    this.createWelcomeMessage();
  }

  /**
   * Set up all event listeners for the interface
   */
  setupEventListeners() {
    if (!this.messageInput || !this.sendButton) return;

    // Input events
    this.messageInput.addEventListener('input', this.handleInputChange.bind(this));
    this.messageInput.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Button events
    this.sendButton.addEventListener('click', () => {
      // Animate send button
      gsap.to(this.sendButton, {
        duration: 0.2,
        scale: 0.9,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(this.sendButton, {
            duration: 0.2,
            scale: 1,
            ease: "elastic.out(1, 0.3)"
          });
        }
      });
      this.sendMessage();
    });
    
    if (this.refreshButton) {
      this.refreshButton.addEventListener('click', () => {
        // Animate refresh button
        gsap.to(this.refreshButton, {
          duration: 0.3,
          rotation: 360,
          ease: "power2.inOut"
        });
        
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(5);
        }
        
        this.resetState();
        this.createWelcomeMessage();
      });
    }
    
    this.setupTextareaAutoResize();
  }

  /**
   * Setup auto-resizing for the textarea
   */
  setupTextareaAutoResize() {
    if (!this.messageInput) return;
    
    const resizeTextarea = () => {
      this.messageInput.style.height = 'auto';
      this.messageInput.style.height = `${Math.min(this.messageInput.scrollHeight, 150)}px`;
    };
    
    this.messageInput.addEventListener('input', resizeTextarea);
    
    // Initial resize
    setTimeout(resizeTextarea, 10);
  }
  
  /**
   * Handle input changes to enable/disable send button
   */
  handleInputChange() {
    if (!this.messageInput || !this.sendButton) return;
    this.sendButton.disabled = !this.messageInput.value.trim();
  }
  
  /**
   * Handle keyboard events in the input field
   */
  handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.sendButton && !this.sendButton.disabled) {
        this.sendMessage();
      }
    }
  }

  /**
   * Create and display the welcome message with currency options
   */
  createWelcomeMessage() {
    if (!this.messagesContainer || !this.welcomeTemplate) return;

    // Clear existing messages
    this.messagesContainer.innerHTML = '';
    
    // Clone the welcome template
    const welcomeMessage = this.welcomeTemplate.content.cloneNode(true);
    
    // Set the greeting based on time of day
    const time = new Date();
    const hour = time.getHours();
    let greeting;
    
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    // Update the greeting text
    welcomeMessage.querySelector('.message-greeting').textContent = `${greeting}! Ready to trade?`;
    
    // Set timestamp
    welcomeMessage.querySelector('.message-timestamp').textContent = this.formatTime(time);
    
    // Append the welcome message to the container
    this.messagesContainer.appendChild(welcomeMessage);
    
    // Setup currency selection buttons
    this.setupCurrencyButtons();
    
    // Track the last message
    this.lastMessageType = 'assistant';
    this.lastMessageTimestamp = Date.now();
    
    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Set up currency selection buttons
   */
  setupCurrencyButtons() {
    const buttons = document.querySelectorAll('.currency-card');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(8);
        }
        
        this.selectedPair = button.dataset.pair;
        this.addMessage(`Selected ${this.selectedPair}`, 'user');
        this.askEntryPrice();
      });
    });
  }

  /**
   * Ask for entry price after currency selection
   */
  askEntryPrice() {
    const pairDisplayName = {
      'EUR/USD': 'Euro / US Dollar',
      'GBP/USD': 'British Pound / US Dollar',
      'XAU/USD': 'Gold / US Dollar'
    }[this.selectedPair] || this.selectedPair;
    
    const message = `What's your entry price for ${pairDisplayName}?`;
    this.addMessage(message, 'assistant');
    this.currentState = 'waiting_for_entry';
  }

  /**
   * Ask for lot size after entry price is provided
   */
  askLotSize() {
    const message = `How many lots would you like to trade?`;
    this.addMessage(message, 'assistant');
    this.currentState = 'waiting_for_lot';
  }

  /**
   * Calculate trading levels based on entry price and pair
   */
  calculateLevels(entry, pair) {
    if (this.selectedPair === 'XAU/USD') {
      // For XAU/USD, calculate in actual price points
      const stopLossPoints = 3;  // 3 points = $300 for 1 lot
      const targetPoints = 10;   // 10 points = $1000 for 1 lot
      
      return {
        stopLoss: entry - stopLossPoints,
        target: entry + targetPoints,
        pips: {
          stopLoss: stopLossPoints,
          target: targetPoints
        }
      };
    }
    
    // For Forex pairs, calculate based on pips
    const pipValue = pair.pipValue;
    let stopLossPips, targetPips;
    
    switch(this.selectedPair) {
      case 'EUR/USD':
        stopLossPips = 10;  // 10 pips
        targetPips = 50;    // 50 pips
        break;
      case 'GBP/USD':
        stopLossPips = 10;  // 10 pips
        targetPips = 50;    // 50 pips
        break;
      default:
        stopLossPips = 10;
        targetPips = 50;
    }

    return {
      stopLoss: entry - (stopLossPips * pipValue),
      target: entry + (targetPips * pipValue),
      pips: {
        stopLoss: stopLossPips,
        target: targetPips
      }
    };
  }

  /**
   * Validate entry price input
   */
  validateEntryPrice(price, pair) {
    const numPrice = parseFloat(price);
    
    if (isNaN(numPrice) || numPrice <= 0) {
      return { valid: false, error: "Please enter a valid entry price." };
    }

    // Price range validation
    if (pair === 'XAU/USD' && (numPrice < 1000 || numPrice > 9999)) {
      return { valid: false, error: "For Gold, enter a price between 1000 and 9999." };
    }

    return { valid: true };
  }

  /**
   * Calculate profit/loss based on levels and lot size
   */
  calculateProfit(levels, lotSize, pair) {
    const pipValue = pair.pipValue;
    let stopLossAmount, targetAmount;
    
    if (this.selectedPair === 'XAU/USD') {
      // For Gold, 1 point = $1 per 0.01 lot
      // So for 1 lot, 1 point = $100
      // For 0.25 lot, 1 point = $25
      const pointValue = lotSize * 100; // $100 per point for 1 lot
      stopLossAmount = levels.pips.stopLoss * pointValue;
      targetAmount = levels.pips.target * pointValue;
    } else {
      // For Forex pairs, standard calculation
      const standardLotValue = 100000; // Standard lot size
      const pipValuePerLot = standardLotValue * pipValue;
      stopLossAmount = levels.pips.stopLoss * pipValuePerLot * lotSize;
      targetAmount = levels.pips.target * pipValuePerLot * lotSize;
    }
    
    return {
      stopLoss: -stopLossAmount,
      target: targetAmount,
      riskReward: targetAmount / Math.abs(stopLossAmount)
    };
  }

  /**
   * Show trade calculations and analysis
   */
  showCalculations() {
    if (!this.selectedPair || !this.entryPrice || !this.calculationTemplate) return;

    const pair = TRADING_PAIRS[this.selectedPair];
    const entry = parseFloat(this.entryPrice);
    const lotSize = this.lotSize;

    const levels = this.calculateLevels(entry, pair);
    const profits = this.calculateProfit(levels, lotSize, pair);

    // Clone the calculation template
    const calculationCard = this.calculationTemplate.content.cloneNode(true);
    
    // Get the currency badge style based on pair
    const pairData = {
      'EUR/USD': { class: 'eur', symbol: 'EUR' },
      'GBP/USD': { class: 'gbp', symbol: 'GBP' },
      'XAU/USD': { class: 'xau', symbol: 'XAU' }
    }[this.selectedPair] || { class: '', symbol: this.selectedPair.split('/')[0] };
    
    // Set the currency badge
    const badge = calculationCard.querySelector('.currency-badge');
    badge.classList.add(pairData.class);
    badge.textContent = pairData.symbol;
    
    // Set the time
    calculationCard.querySelector('.trade-time').textContent = this.formatTime(new Date());
    
    // Set the calculation values
    calculationCard.querySelector('.pair-value').textContent = this.selectedPair;
    calculationCard.querySelector('.entry-value').textContent = parseFloat(this.entryPrice).toFixed(pair.decimals);
    calculationCard.querySelector('.lot-value').textContent = this.lotSize;
    
    const stopLossPips = this.selectedPair === 'XAU/USD'
      ? Math.round(Math.abs(entry - levels.stopLoss) / 0.10)
      : levels.pips.stopLoss;
    const targetPips = this.selectedPair === 'XAU/USD'
      ? Math.round(Math.abs(levels.target - entry) / 0.10)
      : levels.pips.target;
    calculationCard.querySelector('.stop-loss-value').textContent = 
      `${levels.stopLoss.toFixed(pair.decimals)} (${stopLossPips} pips)`;
    
    calculationCard.querySelector('.take-profit-value').textContent = 
      `${levels.target.toFixed(pair.decimals)} (${targetPips} pips)`;
    
    calculationCard.querySelector('.loss-value').textContent = 
      `$${Math.abs(profits.stopLoss).toFixed(2)}`;
    
    calculationCard.querySelector('.profit-value').textContent = 
      `$${profits.target.toFixed(2)}`;
    
    calculationCard.querySelector('.risk-reward-value').textContent = 
      `1:${profits.riskReward.toFixed(2)}`;
    
    // Create assistant message with calculation card
    const assistantMessage = this.assistantMessageTemplate.content.cloneNode(true);
    
    // Set timestamp
    assistantMessage.querySelector('.message-timestamp').textContent = this.formatTime(new Date());
    
    // Set message content
    assistantMessage.querySelector('.message-content').textContent = "Here's your trade summary.";
    
    // Create message group
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group assistant';
    
    // Append message bubble to group
    messageGroup.appendChild(assistantMessage.querySelector('.message-bubble'));
    
    // Append calculation card to group
    messageGroup.appendChild(calculationCard.querySelector('.trade-card'));
    
    // Append to messages container
    this.messagesContainer.appendChild(messageGroup);
    
    // Set up the new calculation button
    this.setupNewCalculationButton();
    
    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Set up the new calculation button
   */
  setupNewCalculationButton() {
    const button = document.getElementById('newCalculationButton');
    if (button) {
      button.addEventListener('click', () => {
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(8);
        }
        
        this.resetState();
        this.createWelcomeMessage();
      });
    }

    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
      shareButton.addEventListener('click', () => {
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(8);
        }
        
        this.shareTradeAnalysis();
      });
    }
  }

  shareTradeAnalysis() {
    const tradeCard = document.querySelector('.trade-card');
    if (!tradeCard) return;

    // Create a canvas element with high resolution
    const scale = 4;
    const width = tradeCard.offsetWidth;
    const height = tradeCard.offsetHeight;

    // Create a temporary container for the card (on-screen, but invisible)
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '0';
    tempContainer.style.top = '0';
    tempContainer.style.width = width + 'px';
    tempContainer.style.opacity = '0';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.zIndex = '9999';
    tempContainer.style.background = '#fff';
    document.body.appendChild(tempContainer);

    // Clone the card and apply necessary styles
    const clonedCard = tradeCard.cloneNode(true);
    clonedCard.style.background = '#fff';
    clonedCard.style.width = width + 'px';
    clonedCard.style.overflow = 'visible';
    clonedCard.style.position = 'static';
    // Remove the footer (buttons) from the cloned card
    const footer = clonedCard.querySelector('.trade-card-footer');
    if (footer) footer.remove();
    // Ensure header is present and visible
    let header = clonedCard.querySelector('.trade-card-header');
    if (!header) {
      // If missing, rebuild it from the original
      const originalHeader = tradeCard.querySelector('.trade-card-header');
      if (originalHeader) {
        header = originalHeader.cloneNode(true);
        clonedCard.insertBefore(header, clonedCard.firstChild);
      }
    }
    if (header) {
      header.style.overflow = 'visible';
      header.style.position = 'static';
      header.style.display = 'flex';
      header.style.background = '#fff';
      header.style.margin = '0';
      header.style.padding = '24px 24px 0 24px'; // match your design
    }
    tempContainer.appendChild(clonedCard);

    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => doCapture());
    } else {
      setTimeout(doCapture, 100);
    }

    function doCapture() {
      html2canvas(clonedCard, {
        scale: scale,
        backgroundColor: '#FFFFFF',
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: true
      }).then(canvas => {
        document.body.removeChild(tempContainer);
        canvas.toBlob(blob => {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(() => {
            const shareButton = document.getElementById('shareButton');
            if (shareButton) {
              const originalText = shareButton.innerHTML;
              shareButton.innerHTML = `
                <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Copied!
              `;
              shareButton.classList.add('success');
              setTimeout(() => {
                shareButton.innerHTML = originalText;
                shareButton.classList.remove('success');
              }, 2000);
            }
          }).catch(err => {
            console.error('Failed to copy image:', err);
            const link = document.createElement('a');
            link.download = 'trade-analysis.png';
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
          });
        }, 'image/png', 1.0);
      }).catch(err => {
        console.error('Failed to generate image:', err);
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
    });
  }
}

/**
   * Reset the application state
   */
  resetState() {
    this.currentState = 'welcome';
    this.selectedPair = null;
    this.entryPrice = null;
    this.lotSize = 1;
    this.lastMessageType = null;
    this.lastMessageTimestamp = null;
  }

  /**
   * Send a message from the input field
   */
  sendMessage() {
    if (!this.messageInput || !this.sendButton) return;
    
    const text = this.messageInput.value.trim();
    if (!text) return;
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(3);
    }
    
    this.addMessage(text, 'user');
    this.processUserInput(text);
    
    // Clear the input field
    this.messageInput.value = '';
    this.messageInput.style.height = 'auto';
    this.sendButton.disabled = true;
  }
  
  /**
   * Process user input based on current state
   */
  processUserInput(text) {
    switch (this.currentState) {
      case 'welcome':
        // Extract pair from text if possible
        const pairMatch = text.match(/(EUR|GBP|USD|XAU)\/[A-Z]{3}/i);
        if (pairMatch) {
          this.selectedPair = pairMatch[0].toUpperCase();
          this.askEntryPrice();
        } else {
          this.addMessage("Sorry, I didn't recognize that pair. Please choose from the options above.", 'assistant');
        }
        break;
      case 'waiting_for_entry':
        this.processEntryPrice(text);
        break;
      case 'waiting_for_lot':
        this.processLotSize(text);
        break;
  }
}

/**
   * Process entry price input
   */
  processEntryPrice(text) {
    const numText = text.replace(/[^\d.]/g, '');
    const price = parseFloat(numText);
    
    const pair = this.selectedPair;
    const validation = this.validateEntryPrice(price, pair);
    
    if (validation.valid) {
      this.entryPrice = price;
      this.askLotSize();
    } else {
      this.addMessage(validation.error, 'assistant');
    }
  }
  
  /**
   * Process lot size input
   */
  processLotSize(text) {
    const numText = text.replace(/[^\d.]/g, '');
    const lotSize = parseFloat(numText);
    
    if (isNaN(lotSize) || lotSize <= 0) {
      this.addMessage("Please enter a valid lot size.", 'assistant');
      return;
    }

    this.lotSize = lotSize;
    this.showCalculations();
  }
  
  /**
   * Add a message to the chat
   */
  addMessage(text, type) {
    if (!this.messagesContainer) return;

    const now = new Date();
    const timeString = this.formatTime(now);
    
    // Check if we should create a new message group or append to the last one
    const shouldCreateNewGroup = this.lastMessageType !== type || 
                               (Date.now() - this.lastMessageTimestamp > 60000);
    
    if (shouldCreateNewGroup) {
      let messageGroup;
      
      if (type === 'user') {
        // Create user message from template
        const userMessage = this.userMessageTemplate.content.cloneNode(true);
        userMessage.querySelector('.message-content').textContent = text;
        
        messageGroup = userMessage.querySelector('.message-group');
        this.messagesContainer.appendChild(messageGroup);
      } else {
        // Create assistant message from template
        const assistantMessage = this.assistantMessageTemplate.content.cloneNode(true);
        assistantMessage.querySelector('.message-timestamp').textContent = timeString;
        assistantMessage.querySelector('.message-content').textContent = text;
        
        messageGroup = assistantMessage.querySelector('.message-group');
        this.messagesContainer.appendChild(messageGroup);
      }

      // Animate new message group
      gsap.from(messageGroup, {
        duration: 0.4,
        y: 20,
        opacity: 0,
        ease: "power2.out"
      });
    } else {
      // Append to the last message group
      const lastMessageGroup = this.messagesContainer.lastElementChild;
      
      // Create a new bubble
      const messageBubble = document.createElement('div');
      messageBubble.className = `message-bubble ${type}`;
      
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.textContent = text;
      
      messageBubble.appendChild(messageContent);
      lastMessageGroup.appendChild(messageBubble);

      // Animate new message bubble
      gsap.from(messageBubble, {
        duration: 0.3,
        scale: 0.9,
        opacity: 0,
        ease: "back.out(1.7)"
      });
    }
    
    this.lastMessageType = type;
    this.lastMessageTimestamp = Date.now();
    
    this.scrollToBottom();
  }
  
  /**
   * Show the typing indicator
   */
  showTyping() {
    if (this.typingIndicator) {
      this.typingIndicator.setAttribute('aria-hidden', 'false');
  }
}

/**
   * Hide the typing indicator
   */
  hideTyping() {
    if (this.typingIndicator) {
      this.typingIndicator.setAttribute('aria-hidden', 'true');
  }
}

/**
   * Scroll to the bottom of the messages container
   */
  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
  
  /**
   * Format a date as a time string
   */
  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

// Initialize the chat interface when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatInterface();
  initializeAppIconAnimation();
  initializeRefreshButton();
  initializeSubtitleAnimation();
});

class PriceTicker {
    constructor() {
        this.prices = {
            'EUR/USD': { price: null, previousPrice: null },
            'GBP/USD': { price: null, previousPrice: null },
            'XAU/USD': { price: null, previousPrice: null }
        };
        this.symbols = {
            'EUR/USD': 'EUR/USD',
            'GBP/USD': 'GBP/USD',
            'XAU/USD': 'XAU/USD'
        };
        this.apiKey = 'e736fce734e749078cdbb6792f69f272';
        this.updateInterval = 5000;
        this.hasLoadedOnce = false;
        this.init();
    }

    init() {
        this.initializeLottieAnimations();
        this.updatePrices();
        setInterval(() => this.updatePrices(), this.updateInterval);
    }

    initializeLottieAnimations() {
        // App Icon Animation
        lottie.loadAnimation({
            container: document.querySelector('.lottie-icon'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'https://assets2.lottiefiles.com/packages/lf20_2cwDXD.json' // Minimal graph animation
        });

        // Typing Indicator Animation
        lottie.loadAnimation({
            container: document.querySelector('.lottie-typing'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'https://assets2.lottiefiles.com/packages/lf20_p8bfn5to.json' // Typing dots animation
        });

        // Avatar Animation
        lottie.loadAnimation({
            container: document.querySelector('.lottie-avatar'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'https://assets2.lottiefiles.com/packages/lf20_2cwDXD.json' // Minimal bot avatar
        });

        // Remove price loading spinner logic
        // (No loading animation for prices)
    }

    async updatePrices() {
        let loadedAny = false;
        try {
            for (const [pair, symbol] of Object.entries(this.symbols)) {
                const response = await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${this.apiKey}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data.price) {
                    let formattedPrice;
                    if (pair === 'XAU/USD') {
                        formattedPrice = parseFloat(data.price).toFixed(2);
                    } else {
                        formattedPrice = parseFloat(data.price).toFixed(5);
                    }
                    this.updatePrice(pair, formattedPrice);
                    loadedAny = true;
                }
            }
        } catch (error) {
            console.error('Error fetching prices:', error);
        }
        // Show price-ticker only after first successful load
        if (loadedAny && !this.hasLoadedOnce) {
            const ticker = document.getElementById('priceTicker');
            if (ticker) ticker.style.display = '';
            this.hasLoadedOnce = true;
        }
    }

    updatePrice(pair, newPrice) {
        const element = document.getElementById(pair.toLowerCase().replace('/', '') + '-price');
        if (!element) return;

        const previousPrice = this.prices[pair].price;
        this.prices[pair].previousPrice = previousPrice;
        this.prices[pair].price = newPrice;

        // Only update the DOM if a new price is available
        if (newPrice) {
            element.textContent = newPrice;
        }
        // Do NOT clear or blank out the price while waiting for new data
        element.classList.remove('up', 'down', 'updating');
        if (previousPrice) {
            if (newPrice > previousPrice) {
                element.classList.add('up');
                // Trigger animation
                anime({
                    targets: element,
                    translateY: [-4, 0],
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            } else if (newPrice < previousPrice) {
                element.classList.add('down');
                // Trigger animation
                anime({
                    targets: element,
                    translateY: [4, 0],
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            }
        }
    }
}

// Initialize price ticker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PriceTicker();
});

async function refresh() {
    if (isRefreshing) return;
    
    isRefreshing = true;
    refreshButton.disabled = true;
    
    // Show loading bar
    const loadingBar = document.getElementById('loadingBar');
    const progress = loadingBar.querySelector('.loading-progress');
    const particles = loadingBar.querySelectorAll('.loading-particles span');
    
    loadingBar.classList.add('active');
    
    try {
        // Animate progress bar
        const progressAnimation = anime({
            targets: progress,
            width: ['0%', '100%'],
            duration: 800,
            easing: 'easeInOutQuart'
        });
        
        // Animate particles
        particles.forEach((particle, index) => {
            anime({
                targets: particle,
                translateX: ['0%', '100%'],
                opacity: [0, 0.8, 0],
                duration: 600,
                delay: index * 200,
                easing: 'easeInOutSine',
                loop: true
            });
        });
        
        await fetchMessages();
        
        // Complete animation
        progressAnimation.pause();
        anime({
            targets: progress,
            width: '100%',
            duration: 200,
            easing: 'easeOutQuart',
            complete: () => {
                // Fade out
                anime({
                    targets: loadingBar,
                    opacity: 0,
                    duration: 300,
                    easing: 'easeOutQuart',
                    complete: () => {
                        loadingBar.classList.remove('active');
                        progress.style.width = '0%';
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('Error refreshing messages:', error);
        // Reset animation on error
        anime({
            targets: loadingBar,
            opacity: 0,
            duration: 200,
            easing: 'easeOutQuart',
            complete: () => {
                loadingBar.classList.remove('active');
                progress.style.width = '0%';
            }
        });
    } finally {
        isRefreshing = false;
        refreshButton.disabled = false;
    }
}

// Clean, minimal: line chart animates in, then fully disappears, then only green/red candlesticks with black wicks appear, then loop
function initializeAppIconAnimation() {
    const svg = document.querySelector('.icon-svg.chart-animated');
    const path = svg.querySelector('.chart-path');
    const dot = svg.querySelector('.chart-dot');
    const candlesGroup = svg.querySelector('.candles');
    // Green candle
    const greenBody = svg.querySelector('.candle-body.candle-green');
    const greenWicks = svg.querySelectorAll('.candle-wick.candle-green');
    // Red candle
    const redBody = svg.querySelector('.candle-body.candle-red');
    const redWicks = svg.querySelectorAll('.candle-wick.candle-red');
    // Path length
    const pathLength = path.getTotalLength();
    path.setAttribute('stroke-dasharray', pathLength);
    path.setAttribute('stroke-dashoffset', pathLength);
    // Helper to reset all
    function resetAll() {
        path.setAttribute('stroke-dashoffset', pathLength);
        path.setAttribute('opacity', 1);
        dot.setAttribute('cx', 6);
        dot.setAttribute('cy', 32);
        dot.setAttribute('opacity', 1);
        candlesGroup.setAttribute('opacity', 0);
        // Reset candle bodies and wicks
        greenBody.setAttribute('height', 0.1);
        greenBody.setAttribute('y', 28.0);
        greenWicks[0].setAttribute('height', 0.1); greenWicks[0].setAttribute('y', 28.0);
        greenWicks[1].setAttribute('height', 0.1); greenWicks[1].setAttribute('y', 28.0);
        redBody.setAttribute('height', 0.1);
        redBody.setAttribute('y', 28.0);
        redWicks[0].setAttribute('height', 0.1); redWicks[0].setAttribute('y', 28.0);
        redWicks[1].setAttribute('height', 0.1); redWicks[1].setAttribute('y', 28.0);
    }
    function animateSequence() {
        resetAll();
        // 1. Draw the chart line (only line and dot visible)
        anime.set([path, dot], { opacity: 1 });
        anime.set(candlesGroup, { opacity: 0 });
        anime({
            targets: path,
            strokeDashoffset: [pathLength, 0],
            duration: 900,
            easing: 'easeInOutCubic',
            complete: () => {
                // 2. Animate the dot along the line
                anime({
                    targets: { progress: 0 },
                    progress: pathLength,
                    duration: 900,
                    easing: 'easeInOutSine',
                    update: anim => {
                        const point = path.getPointAtLength(anim.animations[0].currentValue);
                        dot.setAttribute('cx', point.x);
                        dot.setAttribute('cy', point.y);
                    },
                    complete: () => {
                        // 3. Fade out line and dot (no blue visible)
                        anime({
                            targets: [path, dot],
                            opacity: [1, 0],
                            duration: 350,
                            easing: 'easeInOutCubic',
                            complete: () => {
                                // 4. Animate in candlesticks (only candles visible)
                                anime.set(candlesGroup, { opacity: 1 });
                                // Animate green candle body
                                anime({
                                    targets: greenBody,
                                    height: [0.1, 10],
                                    y: [28, 18],
                                    duration: 350,
                                    easing: 'easeOutBack',
                                    complete: () => {
                                        // Animate green wicks
                                        anime({
                                            targets: greenWicks[0],
                                            height: [0.1, 4],
                                            y: [28, 14],
                                            duration: 200,
                                            easing: 'easeOutBack',
                                        });
                                        anime({
                                            targets: greenWicks[1],
                                            height: [0.1, 4],
                                            y: [28, 28],
                                            duration: 200,
                                            easing: 'easeOutBack',
                                        });
                                        // Animate red candle body after green
                                        anime({
                                            targets: redBody,
                                            height: [0.1, 14],
                                            y: [28, 14],
                                            duration: 350,
                                            delay: 100,
                                            easing: 'easeOutBack',
                                            complete: () => {
                                                // Animate red wicks
                                                anime({
                                                    targets: redWicks[0],
                                                    height: [0.1, 4],
                                                    y: [28, 10],
                                                    duration: 200,
                                                    easing: 'easeOutBack',
                                                });
                                                anime({
                                                    targets: redWicks[1],
                                                    height: [0.1, 4],
                                                    y: [28, 28],
                                                    duration: 200,
                                                    easing: 'easeOutBack',
                                                    complete: () => {
                                                        // 5. Pause, then fade out candlesticks and loop
                                                        setTimeout(() => {
                                                            anime({
                                                                targets: candlesGroup,
                                                                opacity: [1, 0],
                                                                duration: 350,
                                                                easing: 'easeInOutCubic',
                                                                complete: animateSequence
                                                            });
                                                        }, 1200);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    animateSequence();
}

// Initialize refresh button animation
function initializeRefreshButton() {
    const refreshButton = document.getElementById('refreshButton');
    const icon = refreshButton.querySelector('.button-icon');
    
    // Continuous subtle rotation
    anime({
        targets: icon,
        rotate: 360,
        duration: 3000,
        easing: 'linear',
        loop: true,
        direction: 'normal'
    });
    
    // Click animation - faster rotation
    refreshButton.addEventListener('click', () => {
        anime({
            targets: icon,
            rotate: 360,
            duration: 1000,
            easing: 'easeInOutQuart',
            complete: () => {
                // Resume the subtle rotation
                anime({
                    targets: icon,
                    rotate: 360,
                    duration: 3000,
                    easing: 'linear',
                    loop: true,
                    direction: 'normal'
                });
            }
        });
    });
}

// Animate and cycle subtitle taglines
function initializeSubtitleAnimation() {
    const subtitles = [
        'Premium Forex Assistant',
        'Smarter Forex. Simpler Trading.',
        'Your Edge in Forex'
    ];
    const el = document.getElementById('subtitle');
    let idx = 0;
    if (!el) return;
    // Initial fade/slide in
    anime({
        targets: el,
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 700,
        delay: 500,
        easing: 'cubicBezier(.4,0,.2,1)'
    });
    // Cycle taglines
    setInterval(() => {
        anime({
            targets: el,
            opacity: [1, 0],
            duration: 350,
            easing: 'easeInOutCubic',
            complete: () => {
                idx = (idx + 1) % subtitles.length;
                el.textContent = subtitles[idx];
                anime({
                    targets: el,
                    opacity: [0, 1],
                    translateY: [8, 0],
                    duration: 500,
                    easing: 'cubicBezier(.4,0,.2,1)'
                });
            }
        });
    }, 4000);
} 