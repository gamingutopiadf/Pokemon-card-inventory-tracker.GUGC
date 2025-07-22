// Pokemon Card Inventory Tracker - Main JavaScript
console.log('Script.js loading...');

class PokemonCardTracker {
    constructor() {
        console.log('PokemonCardTracker constructor called');
        this.cards = this.loadCardsFromStorage();
        this.currentView = 'grid';
        this.currentTab = 'dashboard';
        this.currentStatsView = 'list'; // Default statistics view
        this.filters = {
            search: '',
            set: '',
            rarity: '',
            condition: ''
        };
        
        this.init();
    }

    init() {
        // Event Listeners
        this.setupEventListeners();
        this.setupInlineFormListeners();
        this.setupTabNavigation();
        this.setupAutocompleteDatalist();
        this.setupUrlScraper();
        this.initializeBackupSystem();
        this.renderCards();
        this.updateSetsFilter();
        this.updateDebugInfo();
        this.updateDashboard();
    }

    // Data Management
    loadCardsFromStorage() {
        try {
            const stored = localStorage.getItem('pokemonCards_testing');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading cards from storage:', error);
            return [];
        }
    }

    saveCardsToStorage() {
        try {
            localStorage.setItem('pokemonCards_testing', JSON.stringify(this.cards));
            this.updateDebugInfo();
        } catch (error) {
            console.error('Error saving cards to storage:', error);
        }
    }

    // Card CRUD Operations
    addCard(cardData) {
        const card = {
            id: Date.now().toString(),
            name: cardData.name,
            set: cardData.set,
            number: cardData.number || '',
            rarity: cardData.rarity,
            type: cardData.type || '',
            hp: parseInt(cardData.hp) || null,
            stage: cardData.stage || '',
            condition: cardData.condition,
            quantity: parseInt(cardData.quantity) || 1,
            purchasePrice: parseFloat(cardData.purchasePrice) || 0,
            imageUrl: cardData.imageUrl || '',
            dateAdded: new Date().toISOString(),
            marketValue: 0 // Will be populated later with API integration
        };

        this.cards.push(card);
        this.saveCardsToStorage();
        this.updateDashboard();
        this.renderCards();
        this.updateSetsFilter();
        
        return card;
    }

    removeCard(cardId) {
        this.cards = this.cards.filter(card => card.id !== cardId);
        this.saveCardsToStorage();
        this.updateDashboard();
        this.renderCards();
        this.updateSetsFilter();
    }

    updateCard(cardId, updates) {
        const cardIndex = this.cards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            this.cards[cardIndex] = { ...this.cards[cardIndex], ...updates };
            this.saveCardsToStorage();
            this.updateDashboard();
            this.renderCards();
        }
    }

    // Filtering and Search
    getFilteredCards() {
        return this.cards.filter(card => {
            const matchesSearch = !this.filters.search || 
                card.name.toLowerCase().includes(this.filters.search.toLowerCase());
            
            // Updated set matching to handle partial matches and different formats
            const matchesSet = !this.filters.set || 
                card.set.toLowerCase().includes(this.filters.set.toLowerCase()) ||
                this.filters.set.toLowerCase().includes(card.set.toLowerCase());
                
            const matchesRarity = !this.filters.rarity || card.rarity === this.filters.rarity;
            const matchesCondition = !this.filters.condition || card.condition === this.filters.condition;
            
            return matchesSearch && matchesSet && matchesRarity && matchesCondition;
        });
    }

    // Inline Form Management
    setupInlineFormListeners() {
        // Toggle inline form
        const addCardBtn = document.getElementById('add-card-btn');
        if (addCardBtn) {
            addCardBtn.addEventListener('click', () => {
                const cardForm = document.getElementById('card-form');
                const isVisible = cardForm.style.display !== 'none';
                cardForm.style.display = isVisible ? 'none' : 'flex';
                
                if (!isVisible) {
                    const nameField = document.getElementById('card-name');
                    if (nameField) nameField.focus();
                }
            });
        }

        // Submit inline form
        const submitBtn = document.getElementById('submit-card');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitInlineCard();
            });
        }

        // Auto-capitalize card name
        const nameField = document.getElementById('card-name');
        if (nameField) {
            nameField.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length > 0) {
                    e.target.value = value.charAt(0).toUpperCase() + value.slice(1);
                }
            });
        }

        // Set dropdown search enhancement
        const setDropdown = document.getElementById('card-set');
        if (setDropdown) {
            setDropdown.addEventListener('input', (e) => {
                console.log('Set typed:', e.target.value);
            });
        }

        // Auto-calculate total price
        this.setupPriceCalculation();
    }

    setupPriceCalculation() {
        // Price calculation removed - total price field has been removed
        // Keeping method for compatibility
    }

    setupAutocompleteDatalist() {
        // Define all Pokemon sets with their codes and years (TCGPlayer format)
        const pokemonSetsRaw = [
            // Scarlet & Violet Era (Standard)
            "Stellar Crown (SV07) - 2024",
            "Shrouded Fable (SV06.5) - 2024",
            "Twilight Masquerade (SV06) - 2024",
            "Temporal Forces (SV05) - 2024",
            "Paldean Fates (SV04.5) - 2024",
            "Paradox Rift (SV04) - 2023",
            "Scarlet & Violet—151 (SV03.5) - 2023",
            "Obsidian Flames (SV03) - 2023",
            "Paldea Evolved (SV02) - 2023",
            "Scarlet & Violet (SV01) - 2023",
            // Sword & Shield Era (Standard)
            "Crown Zenith (SWSH12) - 2023",
            "Silver Tempest (SWSH11) - 2022",
            "Lost Origin (SWSH10) - 2022",
            "Pokémon GO (PGO) - 2022",
            "Astral Radiance (SWSH09) - 2022",
            "Brilliant Stars (SWSH08) - 2022",
            // Sword & Shield Era (Expanded)
            "Fusion Strike (SWSH07) - 2021",
            "Celebrations (SWSH06.5) - 2021",
            "Evolving Skies (SWSH06) - 2021",
            "Chilling Reign (SWSH05.5) - 2021",
            "Battle Styles (SWSH05) - 2021",
            "Shining Fates (SWSH04.5) - 2021",
            "Vivid Voltage (SWSH04) - 2020",
            "Champion's Path (SWSH03.5) - 2020",
            "Darkness Ablaze (SWSH03) - 2020",
            "Rebel Clash (SWSH02) - 2020",
            "Sword & Shield (SWSH01) - 2020",
            // Sun & Moon Era
            "Cosmic Eclipse (SM12) - 2019",
            "Hidden Fates (SM11.5) - 2019",
            "Unified Minds (SM11) - 2019",
            "Unbroken Bonds (SM10) - 2019",
            "Detective Pikachu (DET) - 2019",
            "Team Up (SM09) - 2019",
            "Lost Thunder (SM08) - 2018",
            "Dragon Majesty (SM07.5) - 2018",
            "Celestial Storm (SM07) - 2018",
            "Forbidden Light (SM06) - 2018",
            "Ultra Prism (SM05) - 2018",
            "Crimson Invasion (SM04) - 2017",
            "Shining Legends (SM03.5) - 2017",
            "Burning Shadows (SM03) - 2017",
            "Guardians Rising (SM02) - 2017",
            "Sun & Moon (SM01) - 2017",
            // XY Era
            "Evolutions (XY12) - 2016",
            "Steam Siege (XY11) - 2016",
            "Fates Collide (XY10) - 2016",
            "Generations (GEN) - 2016",
            "BREAKpoint (XY09) - 2016",
            "BREAKthrough (XY08) - 2015",
            "Ancient Origins (XY07) - 2015",
            "Roaring Skies (XY06) - 2015",
            "Double Crisis (XY05.5) - 2015",
            "Primal Clash (XY05) - 2015",
            "Phantom Forces (XY04) - 2014",
            "Furious Fists (XY03) - 2014",
            "Flashfire (XY02) - 2014",
            "XY (XY01) - 2014",
            "Kalos Starter Set (XYP) - 2013",
            // Black & White Era
            "Legendary Treasures (BW11) - 2013",
            "Plasma Blast (BW10) - 2013",
            "Plasma Freeze (BW09) - 2013",
            "Plasma Storm (BW08) - 2013",
            "Boundaries Crossed (BW07) - 2012",
            "Dragon Vault (BW06.5) - 2012",
            "Dragons Exalted (BW06) - 2012",
            "Dark Explorers (BW05) - 2012",
            "Next Destinies (BW04) - 2012",
            "Noble Victories (BW03) - 2011",
            "Emerging Powers (BW02) - 2011",
            "Black & White (BW01) - 2011",
            // HeartGold & SoulSilver Era
            "Call of Legends (COL) - 2011",
            "Triumphant (TM) - 2010",
            "Undaunted (UD) - 2010",
            "Unleashed (UL) - 2010",
            "HeartGold & SoulSilver (HGSS) - 2010",
            // Diamond & Pearl Era
            "Arceus (AR) - 2009",
            "Supreme Victors (SV) - 2009",
            "Rising Rivals (RR) - 2009",
            "Platinum (PL) - 2009",
            "Stormfront (SF) - 2008",
            "Legends Awakened (LA) - 2008",
            "Majestic Dawn (MD) - 2008",
            "Great Encounters (GE) - 2008",
            "Secret Wonders (SW) - 2007",
            "Mysterious Treasures (MT) - 2007",
            "Diamond & Pearl (DP) - 2007",
            // EX Era
            "EX Power Keepers (PK) - 2007",
            "EX Dragon Frontiers (DF) - 2006",
            "EX Crystal Guardians (CG) - 2006",
            "EX Holon Phantoms (HP) - 2006",
            "EX Legend Maker (LM) - 2006",
            "EX Delta Species (DS) - 2005",
            "EX Unseen Forces (UF) - 2005",
            "EX Emerald (EM) - 2005",
            "EX Deoxys (DX) - 2005",
            "EX Team Rocket Returns (TRR) - 2004",
            "EX FireRed & LeafGreen (FRLG) - 2004",
            "EX Hidden Legends (HL) - 2004",
            "EX Team Magma vs Team Aqua (MA) - 2004",
            "EX Dragon (DR) - 2003",
            "EX Sandstorm (SS) - 2003",
            "EX Ruby & Sapphire (RS) - 2003",
            // e-Card Era
            "Skyridge (SK) - 2003",
            "Aquapolis (AQ) - 2003",
            "Expedition Base Set (EX) - 2002",
            // WotC Era
            "Legendary Collection (LC) - 2002",
            "Neo Destiny (N4) - 2001",
            "Southern Islands (SI) - 2001",
            "Neo Revelation (N3) - 2000",
            "Neo Discovery (N2) - 2000",
            "Neo Genesis (N1) - 2000",
            "Gym Challenge (G2) - 2000",
            "Gym Heroes (G1) - 2000",
            "Team Rocket (TR) - 2000",
            "Base Set 2 (B2) - 2000",
            "Fossil (FO) - 1999",
            "Jungle (JU) - 1999",
            "Base Set (BS) - 1998",
            // Special Sets
            "McDonald's Collection (MCD) - Various Years",
            // Custom
            "Custom/Other"
        ];



        // Only keep unique set names that contain parentheses (the ones with codes)
        // Add code prefix (e.g., SWSH05: Battle Styles (SWSH05) - 2021)
        const pokemonSets = Array.from(new Set(
            pokemonSetsRaw
                .filter(set => set.match(/\(([^)]+)\)/))
                .map(set => {
                    // Extract the code in parentheses
                    const codeMatch = set.match(/\(([^)]+)\)/);
                    if (codeMatch) {
                        const code = codeMatch[1];
                        return code + ': ' + set;
                    }
                    return set;
                })
        ));

        // Create filter sets (without years for filter dropdown)
        const filterSets = pokemonSets.map(set => {
            if (set.includes(' - ')) {
                return set.split(' - ')[0]; // Remove year
            }
            return set;
        });

        // Populate card-set datalist
        const setDatalist = document.getElementById('set-options');
        if (setDatalist) {
            pokemonSets.forEach(set => {
                const option = document.createElement('option');
                option.value = set;
                setDatalist.appendChild(option);
            });
        }

        // Populate filter-set datalist
        const filterSetDatalist = document.getElementById('filter-set-options');
        if (filterSetDatalist) {
            // Add "All Sets" option
            const allOption = document.createElement('option');
            allOption.value = '';
            filterSetDatalist.appendChild(allOption);
            
            filterSets.forEach(set => {
                const option = document.createElement('option');
                option.value = set;
                filterSetDatalist.appendChild(option);
            });
        }
    }



    submitInlineCard() {
        const cardData = {
            name: document.getElementById('card-name')?.value?.trim() || '',
            set: document.getElementById('card-set')?.value?.trim() || '',
            cardNumber: document.getElementById('card-number')?.value?.trim() || '',
            rarity: document.getElementById('card-rarity')?.value || '',
            condition: document.getElementById('card-condition')?.value || 'Near Mint (NM) 8',
            purchasePrice: parseFloat(document.getElementById('card-value')?.value) || 0,
            quantity: parseInt(document.getElementById('card-quantity')?.value) || 1,
            imageUrl: document.getElementById('card-image-url')?.value?.trim() || ''
        };

        // Clean up set name (remove code and year from display if present)
        if (cardData.set.includes('(') && cardData.set.includes(')')) {
            // For autocomplete selections, extract just the set name part before the first parentheses
            const setName = cardData.set.split('(')[0].trim();
            cardData.set = setName;
        }
        // If user typed a custom set name, keep it as-is

        // Validate required fields
        if (!cardData.name || !cardData.set || !cardData.cardNumber || !cardData.rarity) {
            alert('Please fill in all required fields (Name, Set, Card Number, Rarity)');
            return;
        }

        // Validate image URL if provided
        if (cardData.imageUrl && !this.isValidImageUrl(cardData.imageUrl)) {
            alert('Please enter a valid image URL');
            return;
        }

        // Check if we're editing or adding
        if (this.editingCardId) {
            this.updateProcessedCard(this.editingCardId, cardData);
        } else {
            // Add new card
            cardData.dateAdded = new Date().toISOString();
            cardData.id = Date.now().toString();
            this.addProcessedCard(cardData);
        }
    }

    updateProcessedCard(cardId, cardData) {
        // Find and update the existing card
        const cardIndex = this.cards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            // Preserve original dateAdded and id
            cardData.dateAdded = this.cards[cardIndex].dateAdded;
            cardData.id = cardId;
            
            // Update the card
            this.cards[cardIndex] = cardData;
            this.saveCardsToStorage();
            this.renderCards();
            this.updateDashboard();
            this.updateSetsFilter();
            
            // Clear editing state and form
            this.editingCardId = null;
            this.clearInlineForm();
            this.resetFormToAddMode();
            
            // Show success message
            console.log('Card updated successfully:', cardData.name);
            alert('Card updated successfully!');
        }
    }

    resetFormToAddMode() {
        // Reset form to add mode
        const form = document.getElementById('card-form');
        const addCardBtn = document.getElementById('add-card-btn');
        const submitBtn = document.getElementById('submit-card');
        const cancelBtn = document.getElementById('cancel-edit-btn');

        form.style.display = 'none';
        addCardBtn.style.display = 'block';

        // Reset the submit button
        submitBtn.textContent = 'Add Card';
        submitBtn.classList.remove('edit-mode');

        // Hide cancel button
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
    }

    addProcessedCard(cardData) {
        // Add card to collection
        this.cards.push(cardData);
        this.saveCardsToStorage();
        this.renderCards();
        this.updateDashboard();
        this.clearInlineForm();
        
        // Trigger backup on addition if enabled
        if (this.backupSettings.autoBackupEnabled && this.backupSettings.frequency === 'onaddition') {
            this.createAutoBackup();
        }
        
        // Show success message
        console.log('Card added successfully:', cardData.name);
    }

    clearInlineForm() {
        ['card-name', 'card-set', 'card-number', 'card-rarity', 
         'card-condition', 'card-value', 'card-quantity', 'card-total-price', 'card-image-url'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'select-one') {
                    element.selectedIndex = 0;
                } else {
                    element.value = '';
                }
            }
        });
        
        // Reset quantity to default value of 1
        const quantityField = document.getElementById('card-quantity');
        if (quantityField) {
            quantityField.value = '1';
        }
        
        // Reset total price to 0
        const totalPriceField = document.getElementById('card-total-price');
        if (totalPriceField) {
            totalPriceField.value = '0.00';
        }
    }

    // UI Management
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // View toggle buttons
        const gridBtn = document.getElementById('grid-view-btn');
        const listBtn = document.getElementById('list-view-btn');
        
        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                this.switchView('grid');
            });
        }
        
        if (listBtn) {
            listBtn.addEventListener('click', () => {
                this.switchView('list');
            });
        }

        // Statistics view toggle buttons
        const statsGridBtn = document.getElementById('stats-grid-view-btn');
        const statsListBtn = document.getElementById('stats-list-view-btn');
        
        if (statsGridBtn) {
            statsGridBtn.addEventListener('click', () => {
                this.switchStatsView('grid');
            });
        }
        
        if (statsListBtn) {
            statsListBtn.addEventListener('click', () => {
                this.switchStatsView('list');
            });
        }

        // Search and filter
        const searchInput = document.getElementById('search-input');
        const filterSet = document.getElementById('filter-set');
        const filterRarity = document.getElementById('filter-rarity');
        const filterCondition = document.getElementById('filter-condition');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.renderCards();
            });
        }

        if (filterSet) {
            filterSet.addEventListener('input', (e) => {
                this.filters.set = e.target.value;
                this.renderCards();
            });
        }

        if (filterRarity) {
            filterRarity.addEventListener('change', (e) => {
                this.filters.rarity = e.target.value;
                this.renderCards();
            });
        }

        if (filterCondition) {
            filterCondition.addEventListener('change', (e) => {
                this.filters.condition = e.target.value;
                this.renderCards();
            });
        }

        // Dev area buttons
        const clearBtn = document.getElementById('clear-data-btn');
        const exportBtn = document.getElementById('export-data-btn');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    setupTabNavigation() {
        // Set initial tab state
        this.currentTab = 'dashboard';
        
        // Tab navigation is already handled in setupEventListeners
        // This method is kept for compatibility
    }

    setupUrlScraper() {
        const scrapeBtn = document.getElementById('scrape-url-btn');
        const urlInput = document.getElementById('card-image-url');
        
        if (scrapeBtn && urlInput) {
            scrapeBtn.addEventListener('click', () => {
                this.scrapeImageUrl(urlInput.value.trim());
            });
            
            // Add Enter key support for URL input
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.scrapeImageUrl(urlInput.value.trim());
                }
            });
            
            // Add paste detection for automatic scraping
            urlInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    const pastedUrl = e.target.value.trim();
                    if (pastedUrl && this.isValidUrl(pastedUrl)) {
                        // Auto-suggest scraping for recognized sites
                        if (pastedUrl.includes('tcgplayer.com') || 
                            pastedUrl.includes('ebay.com') || 
                            pastedUrl.includes('pokemonprice.com')) {
                            
                            if (confirm('🔍 Detected a Pokemon card URL!\n\nWould you like to automatically scrape the image?')) {
                                this.scrapeImageUrl(pastedUrl);
                            }
                        }
                    }
                }, 100);
            });
        }
    }

    extractCardNameFromUrl(url) {
        // Enhanced card name extraction from URLs
        try {
            // Remove domain and get path
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            
            // Look for card names in different URL patterns
            let cardName = '';
            
            // TCGPlayer pattern: /product/12345/pokemon-sword-shield-pikachu
            if (url.includes('tcgplayer.com')) {
                const match = path.match(/\/product\/\d+\/[^\/]*?([a-zA-Z\-\s]+)/);
                if (match) {
                    cardName = match[1].replace(/-/g, ' ').trim();
                }
            }
            
            // eBay pattern: look for pokemon card names
            else if (url.includes('ebay.com')) {
                const match = path.match(/([a-zA-Z\-\s]+pokemon[a-zA-Z\-\s]*)/i);
                if (match) {
                    cardName = match[1].replace(/-/g, ' ').trim();
                }
            }
            
            // General pattern: look for meaningful text segments
            else {
                const segments = path.split('/').filter(seg => 
                    seg.length > 3 && 
                    seg.includes('-') && 
                    !seg.match(/^\d+$/) && 
                    !seg.includes('.')
                );
                
                if (segments.length > 0) {
                    cardName = segments[segments.length - 1].replace(/-/g, ' ').trim();
                }
            }
            
            // Clean up and capitalize
            if (cardName) {
                cardName = cardName
                    .replace(/[^\w\s]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            }
            
            return cardName;
            
        } catch (error) {
            console.error('Error extracting card name:', error);
            return '';
        }
    }

    async scrapeImageUrl(url) {
        if (!url) {
            alert('Please enter a URL to scrape');
            return;
        }

        const scrapeBtn = document.getElementById('scrape-url-btn');
        const originalText = scrapeBtn.textContent;
        
        try {
            scrapeBtn.textContent = 'Scraping...';
            scrapeBtn.disabled = true;

            // Basic URL validation
            if (!this.isValidUrl(url)) {
                throw new Error('Invalid URL format');
            }

            // Extract image and card data from the URL
            const scrapedData = await this.extractImageFromUrl(url);
            
            if (scrapedData.imageUrl) {
                document.getElementById('card-image-url').value = scrapedData.imageUrl;
                
                // Auto-populate other fields if available
                if (scrapedData.cardName) {
                    document.getElementById('card-name').value = scrapedData.cardName;
                }
                if (scrapedData.set) {
                    document.getElementById('card-set').value = scrapedData.set;
                }
                if (scrapedData.cardNumber) {
                    document.getElementById('card-number').value = scrapedData.cardNumber;
                }

                alert('✅ Image URL extracted successfully!\n\n' +
                      `Image URL: ${scrapedData.imageUrl}\n` +
                      (scrapedData.cardName ? `Card Name: ${scrapedData.cardName}\n` : '') +
                      'Check the form fields for auto-populated data.');
            } else {
                // If no image found, try alternative extraction methods
                const fallbackImage = await this.tryFallbackExtraction(url);
                if (fallbackImage) {
                    document.getElementById('card-image-url').value = fallbackImage;
                    alert('✅ Image URL extracted using fallback method!\n\n' +
                          `Image URL: ${fallbackImage}`);
                } else {
                    alert('❌ Could not extract image URL from the provided link.\n\n' +
                          'Please try:\n' +
                          '• Copying the image URL directly\n' +
                          '• Using a different Pokemon card URL\n' +
                          '• Manually entering the image URL');
                }
            }

        } catch (error) {
            console.error('Error scraping URL:', error);
            
            let errorMessage = 'Error scraping URL: ' + error.message;
            if (error.message.includes('CORS') || error.message.includes('fetch')) {
                errorMessage += '\n\nTip: Try copying the image URL directly from the page.';
            }
            
            alert('❌ ' + errorMessage);
        } finally {
            scrapeBtn.textContent = originalText;
            scrapeBtn.disabled = false;
        }
    }

    async tryFallbackExtraction(url) {
        // Try different extraction methods as fallbacks
        try {
            // Method 1: URL pattern matching
            if (url.includes('tcgplayer.com')) {
                return this.extractTCGPlayerImageFromUrl(url);
            }
            
            // Method 2: Check if it's already an image URL
            if (this.isValidImageUrl(url)) {
                return url;
            }
            
            // Method 3: Look for common image URL patterns in the URL
            const imageUrlMatch = url.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i);
            if (imageUrlMatch) {
                return imageUrlMatch[1];
            }
            
        } catch (error) {
            console.error('Fallback extraction failed:', error);
        }
        
        return null;
    }

    async extractImageFromUrl(url) {
        // This function now attempts to scrape HTML content to find image URLs
        const result = {
            imageUrl: '',
            cardName: '',
            set: '',
            cardNumber: ''
        };

        try {
            // If it's already a direct image URL, use it
            if (this.isValidImageUrl(url)) {
                result.imageUrl = url;
                return result;
            }

            // For web pages, we need to use a CORS proxy or fetch API
            // Since we can't directly fetch from other domains due to CORS,
            // we'll use a different approach for common Pokemon card sites
            
            if (url.includes('tcgplayer.com')) {
                result.imageUrl = await this.scrapeTCGPlayerPage(url);
                result.cardName = this.extractCardNameFromUrl(url);
            } else if (url.includes('ebay.com')) {
                result.imageUrl = await this.scrapeEbayPage(url);
                result.cardName = this.extractCardNameFromUrl(url);
            } else if (url.includes('pokemonprice.com')) {
                result.imageUrl = await this.scrapePokemonPricePage(url);
                result.cardName = this.extractCardNameFromUrl(url);
            } else {
                // For other sites, try to extract from URL patterns
                result.imageUrl = this.extractImageFromUrlPattern(url);
                result.cardName = this.extractCardNameFromUrl(url);
            }
            
        } catch (error) {
            console.error('Error extracting data:', error);
        }

        return result;
    }

    async scrapeTCGPlayerPage(url) {
        try {
            // Since we can't directly fetch due to CORS, we'll use a CORS proxy
            // For demonstration, I'll show how this would work with a CORS proxy
            const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
            
            const response = await fetch(proxyUrl);
            const data = await response.json();
            const htmlContent = data.contents;
            
            // Parse HTML to find image URLs
            const imageUrl = this.extractImageFromHTML(htmlContent, 'tcgplayer');
            return imageUrl;
            
        } catch (error) {
            console.error('Error scraping TCGPlayer:', error);
            // Fallback to URL pattern extraction
            return this.extractTCGPlayerImageFromUrl(url);
        }
    }

    extractImageFromHTML(htmlContent, site) {
        // Create a temporary DOM element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        let imageUrl = '';
        
        if (site === 'tcgplayer') {
            // Look for TCGPlayer specific image patterns
            const productImages = tempDiv.querySelectorAll('img[data-testid*="product-image"], img[src*="tcgplayer-cdn"]');
            
            for (let img of productImages) {
                const src = img.getAttribute('src');
                const srcset = img.getAttribute('srcset');
                
                if (src && src.includes('tcgplayer-cdn.tcgplayer.com')) {
                    // Prefer higher resolution images
                    if (srcset) {
                        const highResUrl = this.extractHighestResFromSrcset(srcset);
                        if (highResUrl) {
                            imageUrl = highResUrl;
                            break;
                        }
                    }
                    imageUrl = src;
                    break;
                }
            }
        }
        
        return imageUrl;
    }

    extractHighestResFromSrcset(srcset) {
        // Parse srcset to find the highest resolution image
        const sources = srcset.split(',');
        let highestRes = 0;
        let bestUrl = '';
        
        sources.forEach(source => {
            const parts = source.trim().split(' ');
            if (parts.length >= 2) {
                const url = parts[0];
                const widthMatch = parts[1].match(/(\d+)w/);
                if (widthMatch) {
                    const width = parseInt(widthMatch[1]);
                    if (width > highestRes) {
                        highestRes = width;
                        bestUrl = url;
                    }
                }
            }
        });
        
        return bestUrl;
    }

    extractTCGPlayerImageFromUrl(url) {
        // Enhanced TCGPlayer URL pattern extraction
        const productIdMatch = url.match(/\/product\/(\d+)/);
        if (productIdMatch) {
            const productId = productIdMatch[1];
            // Try different TCGPlayer CDN patterns
            return `https://tcgplayer-cdn.tcgplayer.com/product/${productId}_in_800x800.jpg`;
        }
        
        // Try to extract from URL path
        const pathMatch = url.match(/tcgplayer\.com.*\/([^\/]+)$/);
        if (pathMatch) {
            const cardSlug = pathMatch[1];
            return `https://tcgplayer-cdn.tcgplayer.com/product/${cardSlug}_in_800x800.jpg`;
        }
        
        return '';
    }

    async scrapeEbayPage(url) {
        try {
            const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
            const response = await fetch(proxyUrl);
            const data = await response.json();
            const htmlContent = data.contents;
            
            return this.extractImageFromHTML(htmlContent, 'ebay');
        } catch (error) {
            console.error('Error scraping eBay:', error);
            return '';
        }
    }

    async scrapePokemonPricePage(url) {
        try {
            const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
            const response = await fetch(proxyUrl);
            const data = await response.json();
            const htmlContent = data.contents;
            
            return this.extractImageFromHTML(htmlContent, 'pokemonprice');
        } catch (error) {
            console.error('Error scraping Pokemon Price:', error);
            return '';
        }
    }

    extractImageFromUrlPattern(url) {
        // Try to find image URLs in the URL itself
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        
        for (let ext of imageExtensions) {
            if (url.toLowerCase().includes(ext)) {
                return url;
            }
        }
        
        return '';
    }

    extractCardNameFromUrl(url) {
        // Enhanced card name extraction from URLs
        try {
            // Remove domain and get path
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            
            // Look for card names in different URL patterns
            let cardName = '';
            
            // TCGPlayer pattern: /product/12345/pokemon-sword-shield-pikachu
            if (url.includes('tcgplayer.com')) {
                const match = path.match(/\/product\/\d+\/[^\/]*?([a-zA-Z\-\s]+)/);
                if (match) {
                    cardName = match[1].replace(/-/g, ' ').trim();
                }
            }
            
            // eBay pattern: look for pokemon card names
            else if (url.includes('ebay.com')) {
                const match = path.match(/([a-zA-Z\-\s]+pokemon[a-zA-Z\-\s]*)/i);
                if (match) {
                    cardName = match[1].replace(/-/g, ' ').trim();
                }
            }
            
            // General pattern: look for meaningful text segments
            else {
                const segments = path.split('/').filter(seg => 
                    seg.length > 3 && 
                    seg.includes('-') && 
                    !seg.match(/^\d+$/) && 
                    !seg.includes('.')
                );
                
                if (segments.length > 0) {
                    cardName = segments[segments.length - 1].replace(/-/g, ' ').trim();
                }
            }
            
            // Clean up and capitalize
            if (cardName) {
                cardName = cardName
                    .replace(/[^\w\s]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            }
            
            return cardName;
            
        } catch (error) {
            console.error('Error extracting card name:', error);
            return '';
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    isValidImageUrl(url) {
        if (!this.isValidUrl(url)) return false;
        return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Refresh content if needed
        if (tabName === 'dashboard') {
            this.updateDashboard();
        } else if (tabName === 'statistics') {
            // Initialize statistics view on first visit
            const statisticsTab = document.getElementById('statistics');
            if (statisticsTab && !statisticsTab.classList.contains('list-view') && !statisticsTab.classList.contains('grid-view')) {
                statisticsTab.classList.add(`${this.currentStatsView}-view`);
            }
            this.updateStatistics();
        } else if (tabName === 'backup-menu') {
            this.updateBackupMenu();
        }
    }

    switchView(viewType) {
        this.currentView = viewType;
        
        // Update button states
        const gridBtn = document.getElementById('grid-view-btn');
        const listBtn = document.getElementById('list-view-btn');
        
        if (gridBtn) gridBtn.classList.toggle('active', viewType === 'grid');
        if (listBtn) listBtn.classList.toggle('active', viewType === 'list');
        
        // Update container class
        const container = document.getElementById('cards-container');
        if (container) {
            container.className = 'cards-container'; // Always use the base class
        }
        
        this.renderCards();
    }

    switchStatsView(viewType) {
        this.currentStatsView = viewType;
        
        // Update button states
        const statsGridBtn = document.getElementById('stats-grid-view-btn');
        const statsListBtn = document.getElementById('stats-list-view-btn');
        
        if (statsGridBtn) statsGridBtn.classList.toggle('active', viewType === 'grid');
        if (statsListBtn) statsListBtn.classList.toggle('active', viewType === 'list');
        
        // Update statistics container class
        const statisticsTab = document.getElementById('statistics');
        if (statisticsTab) {
            statisticsTab.classList.remove('grid-view', 'list-view');
            statisticsTab.classList.add(`${viewType}-view`);
        }
        
        // Refresh statistics display
        this.updateStatistics();
    }

    handleAddCard() {
        const photoInput = document.getElementById('card-photo');
        let photoData = null;
        
        // Handle photo if uploaded
        if (photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                photoData = e.target.result;
                this.addCardWithData(photoData);
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            this.addCardWithData(null);
        }
    }

    addCardWithData(photoData) {
        const cardData = {
            name: document.getElementById('card-name').value,
            set: document.getElementById('card-set').value,
            number: document.getElementById('card-number').value,
            rarity: document.getElementById('card-rarity').value,
            type: document.getElementById('card-type').value,
            hp: document.getElementById('card-hp').value,
            stage: document.getElementById('card-stage').value,
            condition: document.getElementById('card-condition').value,
            quantity: document.getElementById('card-quantity').value,
            purchasePrice: document.getElementById('card-price').value,
            photo: photoData
        };

        this.addCard(cardData);
        
        // Close modal and reset form
        document.getElementById('add-card-modal').style.display = 'none';
        document.getElementById('add-card-form').reset();
        document.getElementById('photo-preview').style.display = 'none';
        document.getElementById('preview-image').src = '';
    }

    updateDashboard() {
        const totalCards = this.cards.reduce((sum, card) => sum + card.quantity, 0);
        const totalValue = this.cards.reduce((sum, card) => sum + (card.purchasePrice * card.quantity), 0);
        const recentCount = this.cards.filter(card => {
            const cardDate = new Date(card.dateAdded);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return cardDate > weekAgo;
        }).length;

        // Update Dashboard tab stats
        document.getElementById('total-cards').textContent = totalCards;
        document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('recent-additions').textContent = recentCount;

        // Update Cards tab stats (same data)
        document.getElementById('cards-total-cards').textContent = totalCards;
        document.getElementById('cards-total-value').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('cards-recent-additions').textContent = recentCount;

        this.updateRecentCards();
        this.updateStatistics(); // Keep statistics in sync
    }

    updateRecentCards() {
        const recentCards = this.cards
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 6); // Show 6 recent cards

        const container = document.getElementById('recent-cards-list');
        
        if (recentCards.length === 0) {
            container.innerHTML = '<p class="empty-state">No cards added yet. Go to the Cards tab to add your first card!</p>';
            return;
        }

        // Use the same card structure as the main cards view but smaller
        container.innerHTML = recentCards.map(card => `
            <div class="recent-card">
                <div class="recent-card-image">
                    ${card.imageUrl ? 
                        `<img src="${card.imageUrl}" alt="${card.name}">` : 
                        card.photoData ? 
                        `<img src="${card.photoData}" alt="${card.name}">` : 
                        `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='168' viewBox='0 0 120 168'%3E%3Crect width='120' height='168' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.3em' fill='%23ffffff' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E" alt="${card.name}">`
                    }
                </div>
                <div class="recent-card-info">
                    <p class="recent-card-name">${card.name.charAt(0).toUpperCase() + card.name.slice(1)}</p>
                    <p class="recent-card-set">${card.set}</p>
                    <p class="recent-card-rarity">${card.rarity}</p>
                    <p class="recent-card-value">$${(card.purchasePrice || 0).toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    }

    updateStatistics() {
        // Basic statistics
        const totalCards = this.cards.reduce((sum, card) => sum + card.quantity, 0);
        const totalValue = this.cards.reduce((sum, card) => sum + (card.purchasePrice * card.quantity), 0);
        const uniqueCards = this.cards.length;
        const avgValue = uniqueCards > 0 ? totalValue / totalCards : 0;

        // Update basic stats
        document.getElementById('stats-total-cards').textContent = totalCards;
        document.getElementById('stats-total-value').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('stats-avg-value').textContent = `$${avgValue.toFixed(2)}`;
        document.getElementById('stats-unique-cards').textContent = uniqueCards;

        // Set distribution
        const setDistribution = {};
        this.cards.forEach(card => {
            const quantity = card.quantity || 1;
            setDistribution[card.set] = (setDistribution[card.set] || 0) + quantity;
        });

        const setsContainer = document.getElementById('stats-sets');
        if (Object.keys(setDistribution).length > 0) {
            const sortedSets = Object.entries(setDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10); // Top 10 sets

            setsContainer.innerHTML = sortedSets.map(([set, count]) => `
                <div class="stat-item">
                    <span class="stat-label">${set}</span>
                    <span class="stat-value">${count} cards</span>
                </div>
            `).join('');
        } else {
            setsContainer.innerHTML = '<p>No cards added yet.</p>';
        }

        // Rarity distribution
        const rarityDistribution = {};
        this.cards.forEach(card => {
            const quantity = card.quantity || 1;
            rarityDistribution[card.rarity] = (rarityDistribution[card.rarity] || 0) + quantity;
        });

        const raritiesContainer = document.getElementById('stats-rarities');
        if (Object.keys(rarityDistribution).length > 0) {
            const sortedRarities = Object.entries(rarityDistribution)
                .sort((a, b) => b[1] - a[1]);

            raritiesContainer.innerHTML = sortedRarities.map(([rarity, count]) => `
                <div class="stat-item">
                    <span class="stat-label">${rarity}</span>
                    <span class="stat-value">${count} cards</span>
                </div>
            `).join('');
        } else {
            raritiesContainer.innerHTML = '<p>No cards added yet.</p>';
        }

        // Condition distribution
        const conditionDistribution = {};
        this.cards.forEach(card => {
            const condition = card.condition || 'Near Mint (NM) 8';
            const quantity = card.quantity || 1;
            conditionDistribution[condition] = (conditionDistribution[condition] || 0) + quantity;
        });

        const conditionsContainer = document.getElementById('stats-conditions');
        if (Object.keys(conditionDistribution).length > 0) {
            const sortedConditions = Object.entries(conditionDistribution)
                .sort((a, b) => b[1] - a[1]);

            conditionsContainer.innerHTML = sortedConditions.map(([condition, count]) => `
                <div class="stat-item">
                    <span class="stat-label">${condition}</span>
                    <span class="stat-value">${count} cards</span>
                </div>
            `).join('');
        } else {
            conditionsContainer.innerHTML = '<p>No cards added yet.</p>';
        }

        // Value analysis
        if (this.cards.length > 0) {
            const cardValues = this.cards.map(card => ({
                name: card.name,
                set: card.set,
                totalValue: (card.quantity || 1) * (card.purchasePrice || 0),
                unitPrice: card.purchasePrice || 0
            }));

            const mostValuable = cardValues.reduce((max, card) => 
                card.unitPrice > max.unitPrice ? card : max
            );
            
            const leastValuable = cardValues.reduce((min, card) => 
                card.unitPrice < min.unitPrice ? card : min
            );

            document.getElementById('stats-most-valuable').textContent = 
                `${mostValuable.name} - $${mostValuable.unitPrice.toFixed(2)}`;
            document.getElementById('stats-least-valuable').textContent = 
                `${leastValuable.name} - $${leastValuable.unitPrice.toFixed(2)}`;
        } else {
            document.getElementById('stats-most-valuable').textContent = 'N/A';
            document.getElementById('stats-least-valuable').textContent = 'N/A';
        }

        // Total investment
        const totalInvestment = this.cards.reduce((sum, card) => 
            sum + ((card.quantity || 1) * (card.purchasePrice || 0)), 0
        );
        document.getElementById('stats-total-investment').textContent = `$${totalInvestment.toFixed(2)}`;

        // Cards added this month
        const thisMonth = new Date();
        const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
        const cardsThisMonth = this.cards.filter(card => {
            const cardDate = new Date(card.dateAdded);
            return cardDate >= startOfMonth;
        }).length;
        document.getElementById('stats-cards-this-month').textContent = cardsThisMonth;
    }

    renderCards() {
        const container = document.getElementById('cards-container');
        if (!container) {
            console.error('Cards container not found');
            return;
        }
        
        const filteredCards = this.getFilteredCards();

        if (filteredCards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No cards match your current filters.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('add-card-btn').click()">Add Your First Card</button>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredCards.map(card => `
            <div class="card">
                <div class="card-image">
                    ${card.imageUrl ? 
                        `<img src="${card.imageUrl}" alt="${card.name}">` : 
                        card.photoData ? 
                        `<img src="${card.photoData}" alt="${card.name}">` : 
                        `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.3em' fill='%23ffffff' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E" alt="${card.name}">`
                    }
                </div>
                <div class="card-info">
                    <p class="card-name">${card.name.charAt(0).toUpperCase() + card.name.slice(1)}</p>
                    <p><strong>Set:</strong> ${card.set}</p>
                    <p><strong>Card Number:</strong> ${card.cardNumber || card.number || 'N/A'}</p>
                    <p><strong>Rarity:</strong> ${card.rarity}</p>
                    <p><strong>Condition:</strong> ${card.condition || 'Near Mint (NM) 8'}</p>
                    <p class="quantity"><strong>Quantity:</strong> ${card.quantity || 1}</p>
                    <p><strong>Price:</strong> $${(card.purchasePrice || 0).toFixed(2)}</p>
                    <p class="total-value"><strong>Total Value:</strong> $${((card.quantity || 1) * (card.purchasePrice || 0)).toFixed(2)}</p>
                    <div class="card-actions">
                        <button class="submit-card" onclick="app.editCard('${card.id}')">Edit</button>
                        <button class="delete-card" onclick="app.deleteCard('${card.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateSetsFilter() {
        const sets = [...new Set(this.cards.map(card => card.set))].sort();
        const filterSelect = document.getElementById('filter-set');
        
        if (!filterSelect) return;
        
        // Keep current selection
        const currentValue = filterSelect.value;
        
        // Get the default options (all predefined sets)
        const defaultOptions = filterSelect.innerHTML;
        
        // Add any custom sets that users have added
        const customSets = sets.filter(set => {
            // Check if this set is not already in the default options
            return !defaultOptions.includes(`value="${set}"`);
        });
        
        if (customSets.length > 0) {
            const customOptionsHTML = customSets.map(set => 
                `<option value="${set}">${set} (Custom)</option>`
            ).join('');
            
            // Add custom sets before the "Custom/Other" option
            const customOtherIndex = filterSelect.innerHTML.indexOf('value="Custom/Other"');
            if (customOtherIndex !== -1) {
                const beforeCustom = filterSelect.innerHTML.substring(0, customOtherIndex);
                const afterCustom = filterSelect.innerHTML.substring(customOtherIndex);
                filterSelect.innerHTML = beforeCustom + customOptionsHTML + afterCustom;
            }
        }
        
        // Restore selection if it still exists
        if (sets.includes(currentValue)) {
            filterSelect.value = currentValue;
        }
    }

    // Card Actions
    editCard(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) {
            alert('Card not found!');
            return;
        }

        // Store the card being edited
        this.editingCardId = cardId;

        // Get the form elements
        const form = document.getElementById('card-form');
        const addCardBtn = document.getElementById('add-card-btn');
        const submitBtn = document.getElementById('submit-card');

        // Show the form
        form.style.display = 'block';
        addCardBtn.style.display = 'none';

        // Pre-fill the form with current card data
        document.getElementById('card-name').value = card.name || '';
        document.getElementById('card-set').value = card.set || '';
        document.getElementById('card-number').value = card.cardNumber || card.number || '';
        document.getElementById('card-rarity').value = card.rarity || '';
        document.getElementById('card-condition').value = card.condition || 'Near Mint (NM) 8';
        document.getElementById('card-quantity').value = card.quantity || 1;
        document.getElementById('card-value').value = card.purchasePrice || 0;
        document.getElementById('card-image-url').value = card.imageUrl || '';

        // Change the submit button text and add edit class
        submitBtn.textContent = 'Update Card';
        submitBtn.classList.add('edit-mode');

        // Scroll to the form
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Add a cancel button if it doesn't exist
        let cancelBtn = document.getElementById('cancel-edit-btn');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancel-edit-btn';
            cancelBtn.textContent = 'Cancel Edit';
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.addEventListener('click', () => this.cancelEdit());
            submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
        }
        cancelBtn.style.display = 'inline-block';
    }

    cancelEdit() {
        // Clear editing state
        this.editingCardId = null;

        // Hide the form and show the add button
        const form = document.getElementById('card-form');
        const addCardBtn = document.getElementById('add-card-btn');
        const submitBtn = document.getElementById('submit-card');
        const cancelBtn = document.getElementById('cancel-edit-btn');

        form.style.display = 'none';
        addCardBtn.style.display = 'block';

        // Reset the submit button
        submitBtn.textContent = 'Add Card';
        submitBtn.classList.remove('edit-mode');

        // Hide cancel button
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }

        // Clear the form
        this.clearInlineForm();
    }

    deleteCard(cardId) {
        if (confirm('Are you sure you want to delete this card?')) {
            this.removeCard(cardId);
        }
    }

    // Developer Tools
    clearAllData() {
        this.cards = [];
        this.saveCardsToStorage();
        this.updateDashboard();
        this.renderCards();
        this.updateSetsFilter();
        alert('All data cleared successfully!');
    }

    exportData() {
        const dataStr = JSON.stringify(this.cards, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pokemon-cards-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    updateDebugInfo() {
        const debugInfo = {
            totalCards: this.cards.length,
            totalQuantity: this.cards.reduce((sum, card) => sum + card.quantity, 0),
            totalValue: this.cards.reduce((sum, card) => sum + (card.purchasePrice * card.quantity), 0),
            sets: [...new Set(this.cards.map(card => card.set))].length,
            rarities: [...new Set(this.cards.map(card => card.rarity))],
            conditions: [...new Set(this.cards.map(card => card.condition))],
            storageSize: new Blob([JSON.stringify(this.cards)]).size + ' bytes',
            lastUpdate: new Date().toISOString()
        };

        document.getElementById('debug-info').textContent = JSON.stringify(debugInfo, null, 2);
    }

    // Backup Management
    initializeBackupSystem() {
        // Load backup settings from localStorage
        this.backupSettings = this.loadBackupSettings();
        this.setupBackupEventListeners();
        this.scheduleNextBackup();
    }

    loadBackupSettings() {
        try {
            const stored = localStorage.getItem('backupSettings_testing');
            return stored ? JSON.parse(stored) : {
                autoBackupEnabled: false,
                frequency: 'weekly',
                maxBackups: 10,
                lastBackup: null,
                nextBackup: null
            };
        } catch (error) {
            console.error('Error loading backup settings:', error);
            return {
                autoBackupEnabled: false,
                frequency: 'weekly',
                maxBackups: 10,
                lastBackup: null,
                nextBackup: null
            };
        }
    }

    saveBackupSettings() {
        try {
            localStorage.setItem('backupSettings_testing', JSON.stringify(this.backupSettings));
        } catch (error) {
            console.error('Error saving backup settings:', error);
        }
    }

    setupBackupEventListeners() {
        // Auto backup toggle
        const autoToggle = document.getElementById('auto-backup-toggle');
        if (autoToggle) {
            autoToggle.addEventListener('change', (e) => {
                this.backupSettings.autoBackupEnabled = e.target.checked;
                this.saveBackupSettings();
                this.scheduleNextBackup();
                this.updateBackupMenu();
            });
        }

        // Backup frequency
        const frequencySelect = document.getElementById('backup-frequency');
        if (frequencySelect) {
            frequencySelect.addEventListener('change', (e) => {
                this.backupSettings.frequency = e.target.value;
                this.saveBackupSettings();
                this.scheduleNextBackup();
                this.updateBackupMenu();
            });
        }

        // Max backups
        const maxBackupsInput = document.getElementById('max-backups');
        if (maxBackupsInput) {
            maxBackupsInput.addEventListener('change', (e) => {
                this.backupSettings.maxBackups = parseInt(e.target.value) || 10;
                this.saveBackupSettings();
                this.cleanupOldBackups();
                this.updateBackupMenu();
            });
        }

        // Manual backup buttons
        const createBackupBtn = document.getElementById('create-backup-btn');
        if (createBackupBtn) {
            createBackupBtn.addEventListener('click', () => this.createManualBackup());
        }

        const exportJsonBtn = document.getElementById('export-json-btn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.exportAsJson());
        }

        const exportCsvBtn = document.getElementById('export-csv-btn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportAsCsv());
        }

        // Restore functionality
        const selectFileBtn = document.getElementById('select-restore-file-btn');
        const fileInput = document.getElementById('restore-file-input');
        const restoreBtn = document.getElementById('restore-backup-btn');

        if (selectFileBtn && fileInput) {
            selectFileBtn.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    document.getElementById('selected-file-name').textContent = file.name;
                    restoreBtn.disabled = false;
                } else {
                    document.getElementById('selected-file-name').textContent = '';
                    restoreBtn.disabled = true;
                }
            });
        }

        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.restoreFromBackup());
        }
    }

    updateBackupMenu() {
        // Update toggle state
        const autoToggle = document.getElementById('auto-backup-toggle');
        if (autoToggle) {
            autoToggle.checked = this.backupSettings.autoBackupEnabled;
        }

        // Update frequency
        const frequencySelect = document.getElementById('backup-frequency');
        if (frequencySelect) {
            frequencySelect.value = this.backupSettings.frequency;
        }

        // Update max backups
        const maxBackupsInput = document.getElementById('max-backups');
        if (maxBackupsInput) {
            maxBackupsInput.value = this.backupSettings.maxBackups;
        }

        // Update status
        const lastBackupElement = document.getElementById('last-backup-time');
        const nextBackupElement = document.getElementById('next-backup-time');
        const totalBackupsElement = document.getElementById('total-backups');
        const storageSizeElement = document.getElementById('backup-storage-size');

        if (lastBackupElement) {
            lastBackupElement.textContent = this.backupSettings.lastBackup 
                ? new Date(this.backupSettings.lastBackup).toLocaleString()
                : 'Never';
        }

        if (nextBackupElement) {
            nextBackupElement.textContent = this.backupSettings.nextBackup && this.backupSettings.autoBackupEnabled
                ? new Date(this.backupSettings.nextBackup).toLocaleString()
                : 'Not scheduled';
        }

        // Get backup count and storage size
        const backups = this.getStoredBackups();
        if (totalBackupsElement) {
            totalBackupsElement.textContent = backups.length;
        }

        if (storageSizeElement) {
            const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);
            storageSizeElement.textContent = this.formatFileSize(totalSize);
        }

        // Update backup history
        this.updateBackupHistory();
    }

    scheduleNextBackup() {
        if (!this.backupSettings.autoBackupEnabled) {
            this.backupSettings.nextBackup = null;
            this.saveBackupSettings();
            return;
        }

        const now = new Date();
        let nextBackup = new Date(now);

        switch (this.backupSettings.frequency) {
            case '5minutes':
                nextBackup.setMinutes(nextBackup.getMinutes() + 5);
                break;
            case 'hourly':
                nextBackup.setHours(nextBackup.getHours() + 1);
                break;
            case '3hours':
                nextBackup.setHours(nextBackup.getHours() + 3);
                break;
            case '6hours':
                nextBackup.setHours(nextBackup.getHours() + 6);
                break;
            case '12hours':
                nextBackup.setHours(nextBackup.getHours() + 12);
                break;
            case 'daily':
                nextBackup.setDate(nextBackup.getDate() + 1);
                break;
            case 'weekly':
                nextBackup.setDate(nextBackup.getDate() + 7);
                break;
            case 'biweekly':
                nextBackup.setDate(nextBackup.getDate() + 14);
                break;
            case 'monthly':
                nextBackup.setMonth(nextBackup.getMonth() + 1);
                break;
            case 'quarterly':
                nextBackup.setMonth(nextBackup.getMonth() + 3);
                break;
            case 'onaddition':
                // For on-addition backups, we don't schedule a time-based backup
                this.backupSettings.nextBackup = null;
                this.saveBackupSettings();
                return;
        }

        this.backupSettings.nextBackup = nextBackup.toISOString();
        this.saveBackupSettings();

        // Set up automatic backup check
        this.checkAndPerformAutoBackup();
    }

    checkAndPerformAutoBackup() {
        if (!this.backupSettings.autoBackupEnabled || !this.backupSettings.nextBackup) {
            return;
        }

        const now = new Date();
        const nextBackup = new Date(this.backupSettings.nextBackup);

        if (now >= nextBackup) {
            this.createAutoBackup();
        }

        // Determine check interval based on backup frequency
        let checkInterval = 60 * 60 * 1000; // Default: 1 hour
        
        switch (this.backupSettings.frequency) {
            case '5minutes':
                checkInterval = 30 * 1000; // Check every 30 seconds for 5-minute backups
                break;
            case 'hourly':
                checkInterval = 5 * 60 * 1000; // Check every 5 minutes for hourly backups
                break;
            case '3hours':
            case '6hours':
                checkInterval = 15 * 60 * 1000; // Check every 15 minutes
                break;
            case '12hours':
            case 'daily':
                checkInterval = 30 * 60 * 1000; // Check every 30 minutes
                break;
            case 'weekly':
            case 'biweekly':
            case 'monthly':
            case 'quarterly':
                checkInterval = 60 * 60 * 1000; // Check every hour for longer intervals
                break;
        }

        // Check again after the determined interval
        setTimeout(() => this.checkAndPerformAutoBackup(), checkInterval);
    }

    createManualBackup() {
        const backup = this.createBackupData('manual');
        this.saveBackup(backup);
        alert('✅ Manual backup created successfully!');
        this.updateBackupMenu();
    }

    createAutoBackup() {
        const backup = this.createBackupData('auto');
        this.saveBackup(backup);
        this.backupSettings.lastBackup = new Date().toISOString();
        this.scheduleNextBackup();
        console.log('✅ Automatic backup created successfully!');
        this.updateBackupMenu();
    }

    createBackupData(type) {
        const now = new Date();
        const backup = {
            id: `backup_${now.getTime()}`,
            type: type,
            timestamp: now.toISOString(),
            cardCount: this.cards.length,
            totalValue: this.cards.reduce((sum, card) => sum + (card.purchasePrice * card.quantity), 0),
            version: '1.0',
            data: {
                cards: this.cards,
                settings: this.backupSettings,
                metadata: {
                    exportDate: now.toISOString(),
                    appVersion: '1.0',
                    dataVersion: '1.0'
                }
            }
        };

        backup.size = new Blob([JSON.stringify(backup)]).size;
        return backup;
    }

    saveBackup(backup) {
        try {
            const backups = this.getStoredBackups();
            backups.push(backup);
            
            // Sort by timestamp (newest first)
            backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Limit to max backups
            const limitedBackups = backups.slice(0, this.backupSettings.maxBackups);
            
            localStorage.setItem('cardBackups_testing', JSON.stringify(limitedBackups));
            return true;
        } catch (error) {
            console.error('Error saving backup:', error);
            alert('❌ Error saving backup: ' + error.message);
            return false;
        }
    }

    getStoredBackups() {
        try {
            const stored = localStorage.getItem('cardBackups_testing');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading backups:', error);
            return [];
        }
    }

    cleanupOldBackups() {
        const backups = this.getStoredBackups();
        const limitedBackups = backups.slice(0, this.backupSettings.maxBackups);
        
        try {
            localStorage.setItem('cardBackups_testing', JSON.stringify(limitedBackups));
        } catch (error) {
            console.error('Error cleaning up backups:', error);
        }
    }

    exportAsJson() {
        const exportData = {
            exportDate: new Date().toISOString(),
            appVersion: '1.0',
            cards: this.cards,
            totalCards: this.cards.length,
            totalValue: this.cards.reduce((sum, card) => sum + (card.purchasePrice * card.quantity), 0)
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pokemon-cards-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    exportAsCsv() {
        if (this.cards.length === 0) {
            alert('No cards to export!');
            return;
        }

        const headers = [
            'Name', 'Set', 'Card Number', 'Rarity', 'Condition', 
            'Quantity', 'Unit Price', 'Total Value', 'Date Added', 'Image URL'
        ];

        const csvContent = [
            headers.join(','),
            ...this.cards.map(card => [
                `"${card.name || ''}"`,
                `"${card.set || ''}"`,
                `"${card.cardNumber || card.number || ''}"`,
                `"${card.rarity || ''}"`,
                `"${card.condition || ''}"`,
                card.quantity || 1,
                card.purchasePrice || 0,
                (card.quantity || 1) * (card.purchasePrice || 0),
                `"${card.dateAdded || ''}"`,
                `"${card.imageUrl || ''}"`
            ].join(','))
        ].join('\n');

        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pokemon-cards-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    async restoreFromBackup() {
        const fileInput = document.getElementById('restore-file-input');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a backup file first.');
            return;
        }

        if (!confirm('⚠️ This will replace ALL current data with the backup data. Are you sure you want to continue?')) {
            return;
        }

        try {
            const fileContent = await this.readFileContent(file);
            let backupData;

            if (file.name.endsWith('.json')) {
                backupData = JSON.parse(fileContent);
                
                // Handle different backup formats
                if (backupData.data && backupData.data.cards) {
                    // Our backup format
                    this.cards = backupData.data.cards;
                } else if (backupData.cards) {
                    // Export format
                    this.cards = backupData.cards;
                } else if (Array.isArray(backupData)) {
                    // Raw cards array
                    this.cards = backupData;
                } else {
                    throw new Error('Invalid backup file format');
                }
            } else if (file.name.endsWith('.csv')) {
                this.cards = this.parseCsvContent(fileContent);
            } else {
                throw new Error('Unsupported file format. Please use JSON or CSV files.');
            }

            // Save restored data
            this.saveCardsToStorage();
            
            // Update all displays
            this.updateDashboard();
            this.renderCards();
            this.updateSetsFilter();
            
            // Clear file input
            fileInput.value = '';
            document.getElementById('selected-file-name').textContent = '';
            document.getElementById('restore-backup-btn').disabled = true;

            alert(`✅ Successfully restored ${this.cards.length} cards from backup!`);

        } catch (error) {
            console.error('Error restoring backup:', error);
            alert('❌ Error restoring backup: ' + error.message);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseCsvContent(csvContent) {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const cards = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = this.parseCsvLine(line);
            if (values.length >= headers.length) {
                const card = {
                    id: Date.now().toString() + '_' + i,
                    name: values[0] || '',
                    set: values[1] || '',
                    cardNumber: values[2] || '',
                    rarity: values[3] || '',
                    condition: values[4] || 'Near Mint (NM) 8',
                    quantity: parseInt(values[5]) || 1,
                    purchasePrice: parseFloat(values[6]) || 0,
                    dateAdded: values[8] || new Date().toISOString(),
                    imageUrl: values[9] || ''
                };
                cards.push(card);
            }
        }

        return cards;
    }

    parseCsvLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }

    updateBackupHistory() {
        const historyContainer = document.getElementById('backup-history-list');
        if (!historyContainer) return;

        const backups = this.getStoredBackups();

        if (backups.length === 0) {
            historyContainer.innerHTML = '<p class="empty-state">No backups created yet.</p>';
            return;
        }

        historyContainer.innerHTML = backups.map(backup => `
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-name">
                        ${backup.type === 'auto' ? '🤖 Auto' : '👤 Manual'} Backup
                    </div>
                    <div class="backup-meta">
                        ${new Date(backup.timestamp).toLocaleString()} • 
                        ${backup.cardCount} cards • 
                        $${backup.totalValue.toFixed(2)} • 
                        ${this.formatFileSize(backup.size)}
                    </div>
                </div>
                <div class="backup-actions-mini">
                    <button class="btn btn-sm btn-secondary" onclick="app.downloadBackup('${backup.id}')">
                        Download
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteBackup('${backup.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    downloadBackup(backupId) {
        const backups = this.getStoredBackups();
        const backup = backups.find(b => b.id === backupId);

        if (!backup) {
            alert('Backup not found!');
            return;
        }

        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pokemon-cards-backup-${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
        link.click();
    }

    deleteBackup(backupId) {
        if (!confirm('Are you sure you want to delete this backup?')) {
            return;
        }

        const backups = this.getStoredBackups();
        const filteredBackups = backups.filter(b => b.id !== backupId);

        try {
            localStorage.setItem('cardBackups_testing', JSON.stringify(filteredBackups));
            this.updateBackupMenu();
            alert('✅ Backup deleted successfully!');
        } catch (error) {
            console.error('Error deleting backup:', error);
            alert('❌ Error deleting backup: ' + error.message);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 KB';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PokemonCardTracker...');
    window.app = new PokemonCardTracker();
    console.log('PokemonCardTracker initialized:', window.app);
});
