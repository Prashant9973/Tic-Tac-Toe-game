 // Game state
    const boardEl = document.getElementById('board');
    const turnDisplay = document.getElementById('turnDisplay');
    const restartBtn = document.getElementById('restart');
    const resetScoreBtn = document.getElementById('resetScore');
    const xScoreEl = document.getElementById('xScore');
    const oScoreEl = document.getElementById('oScore');
    const drawScoreEl = document.getElementById('drawScore');

    let board = Array(9).fill(null); // null | 'X' | 'O'
    let currentTurn = 'X';
    let playing = true;
    let scores = { X:0, O:0, D:0 };

    // Winning combos
    const wins = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    // Initialize board UI
    function renderBoard(){
      boardEl.innerHTML = '';
      board.forEach((val,i)=>{
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.textContent = val ? val : '';
        cell.addEventListener('click', onCellClick);
        boardEl.appendChild(cell);
      });
      updateTurnDisplay();
    }

    function updateTurnDisplay(){
      if(!playing) return;
      turnDisplay.textContent = currentTurn;
    }

    function onCellClick(e){
      const idx = Number(e.currentTarget.dataset.index);
      if(!playing || board[idx]) return; // ignore

      makeMove(idx, currentTurn);

      const mode = document.querySelector('input[name="mode"]:checked').value;
      if(mode === 'cpu' && playing){
        // CPU move (if still playing)
        setTimeout(()=>{
          const cpuMove = findBestMove(board, 'O');
          if(cpuMove !== null) makeMove(cpuMove,'O');
        }, 250);
      }
    }

    function makeMove(idx, player){
      if(board[idx] || !playing) return;
      board[idx] = player;
      renderBoard();
      const result = checkWinner(board);
      if(result){
        endGame(result);
      } else {
        currentTurn = currentTurn === 'X' ? 'O' : 'X';
        updateTurnDisplay();
      }
    }

    function checkWinner(b){
      for(const [a,c,d] of wins){
        if(b[a] && b[a] === b[c] && b[a] === b[d]){
          return { winner: b[a], combo: [a,c,d] };
        }
      }
      if(b.every(Boolean)) return { winner: 'D' };
      return null;
    }

    function endGame(result){
      playing = false;
      if(result.winner === 'D'){
        scores.D += 1;
        drawScoreEl.textContent = scores.D;
        turnDisplay.textContent = 'Draw';
      } else {
        scores[result.winner] += 1;
        xScoreEl.textContent = scores.X;
        oScoreEl.textContent = scores.O;
        turnDisplay.textContent = result.winner + ' wins!';
        // highlight winning cells
        result.combo && result.combo.forEach(i=>{
          const cell = boardEl.querySelector(`[data-index="${i}"]`);
          if(cell) cell.style.boxShadow = 'inset 0 -6px 30px rgba(16,185,129,0.12)';
        });
      }
    }

    function restart(preserveScore = true){
      board = Array(9).fill(null);
      currentTurn = 'X';
      playing = true;
      // clear cell highlights
      renderBoard();
      if(!preserveScore){ scores = {X:0,O:0,D:0}; xScoreEl.textContent = 0; oScoreEl.textContent = 0; drawScoreEl.textContent = 0; }
    }

    restartBtn.addEventListener('click', ()=> restart(true));
    resetScoreBtn.addEventListener('click', ()=> restart(false));

    // ----- Simple Minimax CPU (unbeatable) -----
    function findBestMove(currBoard, cpuPlayer){
      // cpuPlayer = 'O', huamn = 'X'
      const human = cpuPlayer === 'O' ? 'X' : 'O';

      function minimax(b, player){
        const res = checkWinner(b);
        if(res){
          if(res.winner === cpuPlayer) return {score: 10};
          if(res.winner === human) return {score: -10};
          if(res.winner === 'D') return {score: 0};
        }

        const moves = [];
        for(let i=0;i<9;i++){
          if(!b[i]){
            const newBoard = b.slice();
            newBoard[i] = player;
            const next = minimax(newBoard, player === 'X' ? 'O' : 'X');
            moves.push({index:i, score: next.score});
          }
        }

        if(player === cpuPlayer){
          // maximize
          let best = moves[0];
          for(const m of moves) if(m.score > best.score) best = m;
          return best;
        } else {
          // minimize
          let best = moves[0];
          for(const m of moves) if(m.score < best.score) best = m;
          return best;
        }
      }

      const choice = minimax(currBoard.slice(), cpuPlayer);
      return choice && typeof choice.index === 'number' ? choice.index : null;
    }

    // initial render
    renderBoard();

    // allow switching mode mid-game (will restart)
    document.querySelectorAll('input[name="mode"]').forEach(r=>{
      r.addEventListener('change', ()=>{ restart(true); });
    });

    // keyboard shortcuts: R restart, C toggle mode
    document.addEventListener('keydown',(e)=>{
      if(e.key.toLowerCase() === 'r') restart(true);
      if(e.key.toLowerCase() === 'c'){
        const cur = document.querySelector('input[name="mode"]:checked').value;
        const other = cur === 'pvp' ? 'cpu' : 'pvp';
        document.querySelector(`input[name="mode"][value="${other}"]`).checked = true;
        restart(true);
      }
    });