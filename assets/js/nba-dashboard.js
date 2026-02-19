// NBA Dashboard JavaScript
class NBADashboard {
  constructor() {
    this.data = window.nbaPlayersData || [];
    this.filteredData = [...this.data];
    this.charts = {};
    
    // Event listeners
    this.setupEventListeners();
    
    // Initialize dashboard
    this.init();
  }

  init() {
    this.populateFilters();
    this.createCharts();
    this.populateTable();
    this.updateInsights();
  }

  setupEventListeners() {
    // Filter controls
    document.getElementById('team-filter').addEventListener('change', () => this.applyFilters());
    document.getElementById('position-filter').addEventListener('change', () => this.applyFilters());
    document.getElementById('age-filter').addEventListener('change', () => this.applyFilters());
    document.getElementById('volatility-filter').addEventListener('change', () => this.applyFilters());
    document.getElementById('reset-filters').addEventListener('click', () => this.resetFilters());

    // Table sorting
    document.getElementById('sort-by').addEventListener('change', () => this.sortTable());
    document.getElementById('sort-order').addEventListener('change', () => this.sortTable());

    // Export functions
    document.getElementById('export-csv').addEventListener('click', () => this.exportCSV());
    document.getElementById('export-json').addEventListener('click', () => this.exportJSON());
  }

  populateFilters() {
    // Populate team filter
    const teams = [...new Set(this.data.map(player => player.team))].sort();
    const teamFilter = document.getElementById('team-filter');
    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team;
      option.textContent = team;
      teamFilter.appendChild(option);
    });
  }

  applyFilters() {
    const teamFilter = document.getElementById('team-filter').value;
    const positionFilter = document.getElementById('position-filter').value;
    const ageFilter = document.getElementById('age-filter').value;
    const volatilityFilter = document.getElementById('volatility-filter').value;

    this.filteredData = this.data.filter(player => {
      // Team filter
      if (teamFilter !== 'all' && player.team !== teamFilter) return false;
      
      // Position filter
      if (positionFilter !== 'all' && player.position !== positionFilter) return false;
      
      // Age filter
      if (ageFilter !== 'all') {
        if (ageFilter === 'young' && player.age >= 25) return false;
        if (ageFilter === 'prime' && (player.age < 25 || player.age > 30)) return false;
        if (ageFilter === 'veteran' && player.age <= 30) return false;
      }
      
      // Volatility filter
      if (volatilityFilter !== 'all') {
        if (volatilityFilter === 'low' && player.volatility_score > 3) return false;
        if (volatilityFilter === 'medium' && (player.volatility_score <= 3 || player.volatility_score > 6)) return false;
        if (volatilityFilter === 'high' && player.volatility_score <= 6) return false;
      }
      
      return true;
    });

    this.updateCharts();
    this.populateTable();
    this.updateInsights();
  }

  resetFilters() {
    document.getElementById('team-filter').value = 'all';
    document.getElementById('position-filter').value = 'all';
    document.getElementById('age-filter').value = 'all';
    document.getElementById('volatility-filter').value = 'all';
    this.applyFilters();
  }

  createCharts() {
    this.createPerformanceChart();
    this.createVolatilityChart();
    this.createAgeTradeChart();
    this.createInjuryChart();
  }

  updateCharts() {
    this.createPerformanceChart();
    this.createVolatilityChart();
    this.createAgeTradeChart();
    this.createInjuryChart();
  }

  createPerformanceChart() {
    const trace = {
      x: this.filteredData.map(player => player.market_value_change),
      y: this.filteredData.map(player => player.per), // Player Efficiency Rating
      mode: 'markers',
      type: 'scatter',
      text: this.filteredData.map(player => 
        `${player.name}<br>Team: ${player.team}<br>PER: ${player.per}<br>Market Change: ${player.market_value_change}%<br>Salary: $${(player.salary/1000000).toFixed(1)}M`
      ),
      hovertemplate: '%{text}<extra></extra>',
      marker: {
        size: this.filteredData.map(player => Math.sqrt(player.salary/1000000) * 2 + 5),
        color: this.filteredData.map(player => player.volatility_score),
        colorscale: 'RdYlBu_r',
        colorbar: {title: 'Volatility Score'},
        opacity: 0.7,
        line: {color: 'white', width: 1}
      }
    };

    const layout = {
      title: 'Market Value Change vs Player Efficiency Rating',
      xaxis: {title: 'Market Value Change (%)'},
      yaxis: {title: 'Player Efficiency Rating (PER)'},
      hovermode: 'closest',
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('performance-chart', [trace], layout, {responsive: true});
  }

  createVolatilityChart() {
    const volatilityRanges = ['1-2', '3-4', '5-6', '7-8', '9-10'];
    const counts = volatilityRanges.map(range => {
      const [min, max] = range.split('-').map(Number);
      return this.filteredData.filter(player => 
        player.volatility_score >= min && player.volatility_score <= max
      ).length;
    });

    const trace = {
      x: volatilityRanges,
      y: counts,
      type: 'bar',
      marker: {
        color: ['#2E86C1', '#28B463', '#F39C12', '#E74C3C', '#8E44AD'],
        opacity: 0.8
      }
    };

    const layout = {
      title: 'Player Distribution by Volatility Score',
      xaxis: {title: 'Volatility Score Range'},
      yaxis: {title: 'Number of Players'},
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('volatility-chart', [trace], layout, {responsive: true});
  }

  createAgeTradeChart() {
    const trace = {
      x: this.filteredData.map(player => player.age),
      y: this.filteredData.map(player => player.trade_likelihood * 100),
      mode: 'markers',
      type: 'scatter',
      text: this.filteredData.map(player => 
        `${player.name}<br>Age: ${player.age}<br>Trade Likelihood: ${(player.trade_likelihood * 100).toFixed(1)}%<br>Contract Years: ${player.contract_years_left}`
      ),
      hovertemplate: '%{text}<extra></extra>',
      marker: {
        size: this.filteredData.map(player => player.contract_years_left * 3 + 5),
        color: this.filteredData.map(player => player.injury_games_missed_2yr),
        colorscale: 'Reds',
        colorbar: {title: 'Injury Games Missed (2yr)'},
        opacity: 0.7,
        line: {color: 'white', width: 1}
      }
    };

    const layout = {
      title: 'Age vs Trade Likelihood',
      xaxis: {title: 'Player Age'},
      yaxis: {title: 'Trade Likelihood (%)'},
      hovermode: 'closest',
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('age-trade-chart', [trace], layout, {responsive: true});
  }

  createInjuryChart() {
    const trace = {
      x: this.filteredData.map(player => player.injury_games_missed_2yr),
      y: this.filteredData.map(player => player.market_value_change),
      mode: 'markers',
      type: 'scatter',
      text: this.filteredData.map(player => 
        `${player.name}<br>Injury Games: ${player.injury_games_missed_2yr}<br>Market Change: ${player.market_value_change}%<br>Age: ${player.age}`
      ),
      hovertemplate: '%{text}<extra></extra>',
      marker: {
        size: this.filteredData.map(player => player.age / 2 + 5),
        color: this.filteredData.map(player => player.age),
        colorscale: 'Viridis',
        colorbar: {title: 'Player Age'},
        opacity: 0.7,
        line: {color: 'white', width: 1}
      }
    };

    const layout = {
      title: 'Injury History vs Market Value Impact',
      xaxis: {title: 'Games Missed (2 years)'},
      yaxis: {title: 'Market Value Change (%)'},
      hovermode: 'closest',
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('injury-chart', [trace], layout, {responsive: true});
  }

  populateTable() {
    const tbody = document.getElementById('players-table-body');
    tbody.innerHTML = '';

    this.sortTable(); // Apply current sorting

    this.filteredData.forEach(player => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="player-name">${player.name}</td>
        <td>${player.team}</td>
        <td>${player.position}</td>
        <td>${player.age}</td>
        <td>${player.ppg}</td>
        <td>$${(player.salary/1000000).toFixed(1)}M</td>
        <td class="${player.market_value_change >= 0 ? 'positive' : 'negative'}">
          ${player.market_value_change >= 0 ? '+' : ''}${player.market_value_change}%
        </td>
        <td class="volatility-${this.getVolatilityLevel(player.volatility_score)}">
          ${player.volatility_score}
        </td>
        <td>${(player.trade_likelihood * 100).toFixed(1)}%</td>
        <td class="${player.injury_games_missed_2yr > 30 ? 'high-injury' : ''}">${player.injury_games_missed_2yr}</td>
      `;
      tbody.appendChild(row);
    });
  }

  getVolatilityLevel(score) {
    if (score <= 3) return 'low';
    if (score <= 6) return 'medium';
    return 'high';
  }

  sortTable() {
    const sortBy = document.getElementById('sort-by').value;
    const sortOrder = document.getElementById('sort-order').value;

    this.filteredData.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle string comparisons
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    this.populateTable();
  }

  updateInsights() {
    // High volatility players
    const highVolatilityPlayers = this.filteredData
      .filter(player => player.volatility_score > 7)
      .sort((a, b) => b.volatility_score - a.volatility_score)
      .slice(0, 3);
    
    document.getElementById('high-volatility-insight').textContent = 
      highVolatilityPlayers.length > 0 
        ? `${highVolatilityPlayers.map(p => p.name).join(', ')}`
        : 'No high volatility players in current filter';

    // Rising market values
    const risingPlayers = this.filteredData
      .filter(player => player.market_value_change > 15)
      .sort((a, b) => b.market_value_change - a.market_value_change)
      .slice(0, 3);
    
    document.getElementById('rising-value-insight').textContent = 
      risingPlayers.length > 0
        ? `${risingPlayers.map(p => `${p.name} (+${p.market_value_change}%)`).join(', ')}`
        : 'No significant market value increases in current filter';

    // Trade watch list
    const tradePlayers = this.filteredData
      .filter(player => player.trade_likelihood > 0.5)
      .sort((a, b) => b.trade_likelihood - a.trade_likelihood)
      .slice(0, 3);
    
    document.getElementById('trade-watch-insight').textContent = 
      tradePlayers.length > 0
        ? `${tradePlayers.map(p => `${p.name} (${(p.trade_likelihood * 100).toFixed(0)}%)`).join(', ')}`
        : 'No high trade likelihood players in current filter';

    // Injury risk
    const injuryRiskPlayers = this.filteredData
      .filter(player => player.injury_games_missed_2yr > 40)
      .sort((a, b) => b.injury_games_missed_2yr - a.injury_games_missed_2yr)
      .slice(0, 3);
    
    document.getElementById('injury-risk-insight').textContent = 
      injuryRiskPlayers.length > 0
        ? `${injuryRiskPlayers.map(p => `${p.name} (${p.injury_games_missed_2yr} games)`).join(', ')}`
        : 'No high injury risk players in current filter';
  }

  exportCSV() {
    const headers = [
      'Name', 'Team', 'Position', 'Age', 'PPG', 'RPG', 'APG', 'Salary', 
      'Market_Value_Change', 'Volatility_Score', 'Trade_Likelihood', 
      'Injury_Games_Missed', 'Contract_Years_Left', 'Experience'
    ];

    const csvContent = [
      headers.join(','),
      ...this.filteredData.map(player => [
        `"${player.name}"`,
        player.team,
        player.position,
        player.age,
        player.ppg,
        player.rpg,
        player.apg,
        player.salary,
        player.market_value_change,
        player.volatility_score,
        player.trade_likelihood,
        player.injury_games_missed_2yr,
        player.contract_years_left,
        player.experience
      ].join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'nba_players_data.csv', 'text/csv');
  }

  exportJSON() {
    const jsonContent = JSON.stringify(this.filteredData, null, 2);
    this.downloadFile(jsonContent, 'nba_players_data.json', 'application/json');
  }

  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a page that has the dashboard
  if (document.getElementById('nba-dashboard')) {
    new NBADashboard();
  }
});