// Pokemon Card Inventory Tracker - Main JavaScript

class PokemonCardTracker {
    constructor() {
        this.cards = this.loadCardsFromStorage();
        this.currentView = 'grid';
        this.currentTab = 'dashboard';
        this.filters = {
            search: '',
            set: '',
            rarity: '',
            condition: ''
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupInlineFormListeners();
        this.updateDashboard();
        this.renderCards();
        this.updateSetsFilter();
        this.updateDebugInfo();
        this.setupPhotoUpload();
    }

    // Data Management
    loadCardsFromStorage() {
        try {
            const stored = localStorage.getItem('pokemonCards');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading cards from storage:', error);
            return [];
        }
    }

    saveCardsToStorage() {
        try {
            localStorage.setItem('pokemonCards', JSON.stringify(this.cards));
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
            photo: cardData.photo || null,
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
            const matchesSet = !this.filters.set || card.set === this.filters.set;
            const matchesRarity = !this.filters.rarity || card.rarity === this.filters.rarity;
            const matchesCondition = !this.filters.condition || card.condition === this.filters.condition;
            
            return matchesSearch && matchesSet && matchesRarity && matchesCondition;
        });
    }

    // UI Management
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add card modal
        const addCardBtn = document.getElementById('add-card-btn');
        const modal = document.getElementById('add-card-modal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-add');
        const form = document.getElementById('add-card-form');

        addCardBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            form.reset();
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            form.reset();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                form.reset();
            }
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddCard();
        });

        // Auto-calculate total price in modal form
        const modalQuantityField = document.getElementById('card-quantity');
        const modalPriceField = document.getElementById('card-price');
        const modalTotalPriceField = document.getElementById('card-total-price');

        if (modalQuantityField && modalPriceField && modalTotalPriceField) {
            const calculateModalTotal = () => {
                const quantity = parseInt(modalQuantityField.value) || 1;
                const unitPrice = parseFloat(modalPriceField.value) || 0;
                const total = quantity * unitPrice;
                modalTotalPriceField.value = total.toFixed(2);
            };

            modalQuantityField.addEventListener('input', calculateModalTotal);
            modalPriceField.addEventListener('input', calculateModalTotal);
        }

        // View toggle
        document.getElementById('grid-view-btn').addEventListener('click', () => {
            this.switchView('grid');
        });

        document.getElementById('list-view-btn').addEventListener('click', () => {
            this.switchView('list');
        });

        // Search and filters
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.renderCards();
        });

        document.getElementById('filter-set').addEventListener('change', (e) => {
            this.filters.set = e.target.value;
            this.renderCards();
        });

        document.getElementById('filter-rarity').addEventListener('change', (e) => {
            this.filters.rarity = e.target.value;
            this.renderCards();
        });

        document.getElementById('filter-condition').addEventListener('change', (e) => {
            this.filters.condition = e.target.value;
            this.renderCards();
        });

        // Developer tools
        document.getElementById('clear-data-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                this.clearAllData();
            }
        });

        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });
    }

    setupPhotoUpload() {
        const photoInput = document.getElementById('card-photo');
        const photoPreview = document.getElementById('photo-preview');
        const previewImage = document.getElementById('preview-image');
        const removePhotoBtn = document.getElementById('remove-photo');

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                    photoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        removePhotoBtn.addEventListener('click', () => {
            photoInput.value = '';
            photoPreview.style.display = 'none';
            previewImage.src = '';
        });
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
        }
    }

    switchView(viewType) {
        this.currentView = viewType;
        
        // Update button states
        document.getElementById('grid-view-btn').classList.toggle('active', viewType === 'grid');
        document.getElementById('list-view-btn').classList.toggle('active', viewType === 'list');
        
        // Update container class
        const container = document.getElementById('cards-container');
        container.className = viewType === 'grid' ? 'cards-grid' : 'cards-list';
        
        this.renderCards();
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
        const quantity = parseInt(document.getElementById('card-quantity').value) || 1;
        const purchasePrice = parseFloat(document.getElementById('card-price').value) || 0;
        const totalPrice = quantity * purchasePrice;

        const cardData = {
            name: document.getElementById('card-name').value,
            set: document.getElementById('card-set').value,
            number: document.getElementById('card-number').value,
            rarity: document.getElementById('card-rarity').value,
            type: document.getElementById('card-type').value,
            hp: document.getElementById('card-hp').value,
            stage: document.getElementById('card-stage').value,
            condition: document.getElementById('card-condition').value,
            quantity: quantity,
            purchasePrice: purchasePrice,
            totalPrice: totalPrice,
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

        document.getElementById('total-cards').textContent = totalCards;
        document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('recent-additions').textContent = recentCount;

        this.updateRecentCards();
    }

    updateRecentCards() {
        const recentCards = this.cards
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 5);

        const container = document.getElementById('recent-cards-list');
        
        if (recentCards.length === 0) {
            container.innerHTML = '<p class="empty-state">No cards added yet. Go to the Cards tab to add your first card!</p>';
            return;
        }

        container.innerHTML = recentCards.map(card => `
            <div class="card-item">
                <div class="card-header">
                    <h4 class="card-name">${card.name}</h4>
                </div>
                <div class="card-details">
                    <div class="card-detail">
                        <span class="label">Set:</span>
                        <span class="value">${card.set}</span>
                    </div>
                    <div class="card-detail">
                        <span class="label">Rarity:</span>
                        <span class="value">${card.rarity}</span>
                    </div>
                    <div class="card-detail">
                        <span class="label">Condition:</span>
                        <span class="value">${card.condition}</span>
                    </div>
                    <div class="card-detail">
                        <span class="label">Quantity:</span>
                        <span class="value">${card.quantity}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderCards() {
        const container = document.getElementById('cards-container');
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
            <div class="card-item">
                ${card.photo ? `<div class="card-photo"><img src="${card.photo}" alt="${card.name}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;"></div>` : ''}
                <div class="card-content">
                    <div class="card-header">
                        <h4 class="card-name">${card.name}</h4>
                        <div class="card-actions">
                            <button class="btn btn-secondary" onclick="app.editCard('${card.id}')">Edit</button>
                            <button class="btn btn-danger" onclick="app.deleteCard('${card.id}')">Delete</button>
                        </div>
                    </div>
                    <div class="card-details">
                        <div class="card-detail">
                            <span class="label">Set:</span>
                            <span class="value">${card.set}</span>
                        </div>
                        <div class="card-detail">
                            <span class="label">Number:</span>
                            <span class="value">${card.number || 'N/A'}</span>
                        </div>
                        <div class="card-detail">
                            <span class="label">Rarity:</span>
                            <span class="value">${card.rarity}</span>
                        </div>
                        ${card.type ? `<div class="card-detail">
                            <span class="label">Type:</span>
                            <span class="value">${card.type}</span>
                        </div>` : ''}
                        ${card.hp ? `<div class="card-detail">
                            <span class="label">HP:</span>
                            <span class="value">${card.hp}</span>
                        </div>` : ''}
                        ${card.stage ? `<div class="card-detail">
                            <span class="label">Stage:</span>
                            <span class="value">${card.stage}</span>
                        </div>` : ''}
                        <div class="card-detail">
                            <span class="label">Condition:</span>
                            <span class="value">${card.condition}</span>
                        </div>
                        <div class="card-detail">
                            <span class="label">Quantity:</span>
                            <span class="value">${card.quantity}</span>
                        </div>
                        <div class="card-detail">
                            <span class="label">Unit Price:</span>
                            <span class="value">$${(card.purchasePrice || 0).toFixed(2)}</span>
                        </div>
                        <div class="card-detail">
                            <span class="label">Total Price:</span>
                            <span class="value">$${(card.totalPrice || (card.purchasePrice * card.quantity) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateSetsFilter() {
        const sets = [...new Set(this.cards.map(card => card.set))].sort();
        const filterSelect = document.getElementById('filter-set');
        
        // Keep current selection
        const currentValue = filterSelect.value;
        
        filterSelect.innerHTML = '<option value="">All Sets</option>' +
            sets.map(set => `<option value="${set}">${set}</option>`).join('');
        
        // Restore selection if it still exists
        if (sets.includes(currentValue)) {
            filterSelect.value = currentValue;
        }
    }

    // Card Actions
    editCard(cardId) {
        // TODO: Implement edit functionality
        alert('Edit functionality coming soon!');
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

    // Modal Form Management
    setupInlineFormListeners() {
        // This method can be used for any additional modal form enhancements
        // The main modal functionality is already handled in setupEventListeners()
        
        // Auto-capitalize card name in modal
        const nameField = document.getElementById('card-name');
        if (nameField) {
            nameField.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length > 0) {
                    e.target.value = value.charAt(0).toUpperCase() + value.slice(1);
                }
            });
        }
        
        console.log('Modal form listeners initialized');
    }

    setupPriceCalculation() {
        const quantityField = document.getElementById('card-quantity');
        const priceField = document.getElementById('card-price');
        const totalPriceField = document.getElementById('card-total-price');

        if (quantityField && priceField && totalPriceField) {
            const calculateTotal = () => {
                const quantity = parseInt(quantityField.value) || 1;
                const unitPrice = parseFloat(priceField.value) || 0;
                const total = quantity * unitPrice;
                totalPriceField.value = total.toFixed(2);
            };

            quantityField.addEventListener('input', calculateTotal);
            priceField.addEventListener('input', calculateTotal);
        }
    }

    submitInlineCard() {
        const cardData = {
            name: document.getElementById('card-name')?.value?.trim() || '',
            set: document.getElementById('card-set')?.value?.trim() || '',
            cardNumber: document.getElementById('card-number')?.value?.trim() || '',
            rarity: document.getElementById('card-rarity')?.value || '',
            condition: document.getElementById('card-condition')?.value || 'Near Mint',
            purchasePrice: parseFloat(document.getElementById('card-price')?.value) || 0,
            quantity: parseInt(document.getElementById('card-quantity')?.value) || 1,
            totalPrice: parseFloat(document.getElementById('card-total-price')?.value) || 0,
            imageUrl: document.getElementById('card-image-url')?.value?.trim() || '',
            dateAdded: new Date().toISOString(),
            id: Date.now().toString()
        };

        // Validate required fields
        if (!cardData.name || !cardData.set || !cardData.cardNumber || !cardData.rarity) {
            alert('Please fill in all required fields (Name, Set, Card Number, Rarity)');
            return;
        }

        this.addProcessedCard(cardData);
    }

    addProcessedCard(cardData) {
        this.cards.push(cardData);
        this.saveCardsToStorage();
        this.updateDashboard();
        this.renderCards();
        this.clearInlineForm();
    }

    clearInlineForm() {
        ['card-name', 'card-set', 'card-number', 'card-rarity', 
         'card-condition', 'card-price', 'card-quantity', 'card-total-price', 'card-image-url'].forEach(id => {
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PokemonCardTracker();
});
