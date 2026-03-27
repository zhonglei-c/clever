import { Room, Client } from "@colyseus/core";
import { GameStateSchema, PlayerState, Die, PendingBonus } from "../schema/GameState";

export class CleverRoom extends Room<GameStateSchema> {
  maxClients = 6;

  private DIE_COLORS = ['yellow', 'blue', 'green', 'orange', 'purple', 'white'];

  onCreate(options: any) {
    this.setState(new GameStateSchema());
    this.state.roomID = this.roomId;
    this.state.phase = "WAITING";
    this.state.maxRounds = 4;
    this.state.round = 1;
    this.state.remainingRolls = 3;
    console.log(`[Clever] Room created: ${this.roomId}`);

    this.onMessage("start", (client) => {
      if (this.state.phase === "WAITING") {
        this.startNewTurn();
      }
    });

    this.onMessage("roll", (client) => {
      const activePlayer = this.getActivePlayer();
      if (!activePlayer || client.sessionId !== activePlayer.sessionId) return;
      if (this.state.phase !== "ROLLING") return;
      if (this.state.remainingRolls <= 0) return;

      this.doRoll();
    });

    this.onMessage("reroll", (client) => {
      const activePlayer = this.getActivePlayer();
      if (!activePlayer || client.sessionId !== activePlayer.sessionId) return;
      if (this.state.phase !== "SELECTING") return; 
      if (activePlayer.bonuses.rerolls <= 0) return;

      activePlayer.bonuses.rerolls--;
      this.doRoll(); 
      console.log(`[Clever] Player ${activePlayer.name} used a Reroll.`);
    });

    this.onMessage("selectDie", (client, dieId: string) => {
      const activePlayer = this.getActivePlayer();
      if (!activePlayer || client.sessionId !== activePlayer.sessionId) return;
      if (this.state.phase !== "SELECTING") return;

      const die = this.state.pool.find(d => d.id === dieId);
      if (die) {
        this.state.phase = "MARKING";
        (client as any).pendingDieId = dieId;
      }
    });

    this.onMessage("mark", (client, message: { area: string, index?: number, row?: number, col?: number, isBonus?: boolean, value?: number }) => {
      const activePlayer = this.getActivePlayer();
      if (!activePlayer) return;
      
      const isMyTurn = client.sessionId === activePlayer.sessionId;
      const hasPendingBonus = activePlayer.pendingBonuses.length > 0;
      
      if (!isMyTurn && !hasPendingBonus) return;

      const dieId = (client as any).pendingDieId;
      const die = message.isBonus ? null : this.state.pool.find(d => d.id === dieId);
      
      if (!message.isBonus && !die) return;

      const success = message.isBonus 
        ? this.applyBonusMark(activePlayer, message)
        : this.validateAndMark(activePlayer, die!, message);

      if (success) {
        if (!message.isBonus) {
          this.doSelect(dieId);
        } else {
          activePlayer.pendingBonuses.shift();
        }
        
        this.checkAndApplyBonuses(activePlayer);
        this.calculateTotalScore(activePlayer);

        if (activePlayer.pendingBonuses.length > 0) {
          this.state.phase = "BONUS_MARKING";
        }
      }
    });

    this.onMessage("finishPassiveTurn", (client, message: { dieId: string }) => {
      if (this.state.phase !== "PASSIVE_CHOOSING") return;
      const player = this.state.players.get(client.sessionId);
      const activePlayer = this.getActivePlayer();
      if (!player || !activePlayer || player.sessionId === activePlayer.sessionId) return;

      const die = this.state.silverPlatter.find(d => d.id === message.dieId) || 
                  this.state.selected.find(d => d.id === message.dieId);
      
      if (die) {
        // 在被动阶段，我们简化处理：玩家选择后直接标记已完成
        // TODO: 这里如果需要被动玩家也做校验和标记，逻辑会更复杂
        (player as any)._passive_done = true;
        this.checkAndNextTurn();
      }
    });
  }

  private checkAndNextTurn() {
    const players = Array.from(this.state.players.values());
    const activePlayer = this.getActivePlayer();
    const allPassiveDone = players.every(p => 
      p.sessionId === activePlayer.sessionId || (p as any)._passive_done
    );

    if (allPassiveDone) {
      players.forEach(p => (p as any)._passive_done = false);

      this.state.activePlayerIndex++;
      if (this.state.activePlayerIndex >= this.state.players.size) {
        this.state.activePlayerIndex = 0;
        this.state.round++;
      }

      if (this.state.round > this.state.maxRounds) {
        this.state.phase = "GAME_OVER";
      } else {
        this.startNewTurn();
      }
    }
  }

  private validateAndMark(player: PlayerState, die: Die, target: any): boolean {
    const { area, row, col } = target;
    const val = die.value;
    const sheet = player.sheet;

    switch (area) {
      case 'yellow':
        const YELLOW_GRID = [[3, 6, 5, 0], [2, 1, 0, 5], [1, 0, 2, 4], [0, 3, 4, 6]];
        if (row === undefined || col === undefined) return false;
        if (YELLOW_GRID[row][col] !== val && die.color !== 'white') return false;
        if ((sheet.yellow as any)[`row${row}`][col]) return false;
        (sheet.yellow as any)[`row${row}`][col] = true;
        return true;

      case 'blue':
        const whiteDie = this.state.pool.find(d => d.color === 'white') || 
                        this.state.selected.find(d => d.color === 'white') ||
                        this.state.silverPlatter.find(d => d.color === 'white');
        const blueSum = val + (whiteDie ? whiteDie.value : 0);
        const blueIdx = blueSum - 2;
        if (blueIdx < 0 || blueIdx > 10) return false;
        if (sheet.blue.marks[blueIdx]) return false;
        sheet.blue.marks[blueIdx] = true;
        return true;

      case 'green':
        const thresholds = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6];
        const gIdx = sheet.green.marks.findIndex(m => !m);
        if (gIdx === -1 || val < thresholds[gIdx]) return false;
        sheet.green.marks[gIdx] = true;
        return true;

      case 'orange':
        const oIdx = sheet.orange.values.findIndex(v => v === 0);
        if (oIdx === -1) return false;
        sheet.orange.values[oIdx] = val;
        return true;

      case 'purple':
        const pIdx = sheet.purple.values.findIndex(v => v === 0);
        if (pIdx === -1) return false;
        const lastVal = pIdx > 0 ? sheet.purple.values[pIdx - 1] : 0;
        if (val <= lastVal && lastVal !== 6) return false;
        sheet.purple.values[pIdx] = val;
        return true;
    }
    return false;
  }

  private applyBonusMark(player: PlayerState, target: any): boolean {
    const bonus = player.pendingBonuses[0];
    if (!bonus) return false;

    if (bonus.type === 'yellow_x' && target.area === 'yellow') {
      const { row, col } = target;
      if ((player.sheet.yellow as any)[`row${row}`][col]) return false;
      (player.sheet.yellow as any)[`row${row}`][col] = true;
      return true;
    }
    if (bonus.type === 'blue_x' && target.area === 'blue') {
      const bIdx = (target.value || 0) - 2;
      if (bIdx < 0 || bIdx > 10) return false;
      if (player.sheet.blue.marks[bIdx]) return false;
      player.sheet.blue.marks[bIdx] = true;
      return true;
    }
    if (bonus.type === 'green_x' && target.area === 'green') {
      const gIdx = player.sheet.green.marks.findIndex(m => !m);
      if (gIdx === -1) return false;
      player.sheet.green.marks[gIdx] = true;
      return true;
    }
    if (bonus.type === 'orange_6' && target.area === 'orange') {
      const oIdx = player.sheet.orange.values.findIndex(v => v === 0);
      if (oIdx === -1) return false;
      player.sheet.orange.values[oIdx] = 6;
      return true;
    }
    if (bonus.type === 'purple_6' && target.area === 'purple') {
      const pIdx = player.sheet.purple.values.findIndex(v => v === 0);
      if (pIdx === -1) return false;
      player.sheet.purple.values[pIdx] = 6;
      return true;
    }
    return false;
  }

  private checkAndApplyBonuses(player: PlayerState) {
    const s = player.sheet;
    const b = player.bonuses;
    const p = player as any;

    if (s.yellow.row0[0] && s.yellow.row1[0] && s.yellow.row2[0] && !p._y_c0) { this.addBonus(player, 'blue_x'); p._y_c0 = true; }
    if (s.yellow.row0[1] && s.yellow.row1[1] && s.yellow.row3[1] && !p._y_c1) { this.addBonus(player, 'green_x'); p._y_c1 = true; }
    if (s.yellow.row1[2] && s.yellow.row2[2] && s.yellow.row3[2] && !p._y_c2) { this.addBonus(player, 'orange_6'); p._y_c2 = true; }
    if (s.yellow.row0[3] && s.yellow.row2[3] && s.yellow.row3[3] && !p._y_c3) { this.addBonus(player, 'blue_x'); p._y_c3 = true; }
    if (s.yellow.row1[0] && s.yellow.row1[1] && s.yellow.row1[3] && !p._y_r1) { b.foxes++; p._y_r1 = true; }

    const bCount = s.blue.marks.filter(m => m).length;
    if (bCount >= 2 && !p._b_b2) { b.rerolls++; p._b_b2 = true; }
    if (bCount >= 3 && !p._b_b3) { this.addBonus(player, 'orange_6'); p._b_b3 = true; }
    if (bCount >= 5 && !p._b_b5) { this.addBonus(player, 'yellow_x'); p._b_b5 = true; }
    if (bCount >= 7 && !p._b_b7) { b.foxes++; p._b_b7 = true; }
    if (bCount >= 9 && !p._b_b9) { this.addBonus(player, 'green_x'); p._b_b9 = true; }
    if (bCount >= 11 && !p._b_b11) { this.addBonus(player, 'purple_6'); p._b_b11 = true; }

    if (s.green.marks[3] && !p._g_b3) { b.plusOnes++; p._g_b3 = true; }
    if (s.green.marks[5] && !p._g_b6) { this.addBonus(player, 'blue_x'); p._g_b6 = true; }
    if (s.green.marks[6] && !p._g_b7) { b.foxes++; p._g_b7 = true; }
    if (s.green.marks[8] && !p._g_b9) { this.addBonus(player, 'purple_6'); p._g_b9 = true; }

    if (s.orange.values[2] > 0 && !p._o_b3) { b.rerolls++; p._o_b3 = true; }
    if (s.orange.values[4] > 0 && !p._o_b5) { this.addBonus(player, 'yellow_x'); p._o_b5 = true; }
    if (s.orange.values[5] > 0 && !p._o_b6) { b.plusOnes++; p._o_b6 = true; }
    if (s.orange.values[7] > 0 && !p._o_b8) { b.foxes++; p._o_b8 = true; }
    if (s.orange.values[8] > 0 && !p._o_b9) { this.addBonus(player, 'purple_6'); p._o_b9 = true; }

    if (s.purple.values[2] > 0 && !p._p_b3) { b.rerolls++; p._p_b3 = true; }
    if (s.purple.values[3] > 0 && !p._p_b4) { this.addBonus(player, 'blue_x'); p._p_b4 = true; }
    if (s.purple.values[5] > 0 && !p._p_b6) { b.plusOnes++; p._p_b6 = true; }
    if (s.purple.values[6] > 0 && !p._p_b7) { this.addBonus(player, 'yellow_x'); p._p_b7 = true; }
    if (s.purple.values[7] > 0 && !p._p_b8) { b.foxes++; p._p_b8 = true; }
    if (s.purple.values[8] > 0 && !p._p_b9) { this.addBonus(player, 'green_x'); p._p_b9 = true; }
    if (s.purple.values[10] > 0 && !p._p_b11) { b.plusOnes++; p._p_b11 = true; }
  }

  private addBonus(player: PlayerState, type: string) {
    player.pendingBonuses.push(new PendingBonus(type));
  }

  private calculateTotalScore(player: PlayerState) {
    const s = player.sheet;
    let scores = { yellow: 0, blue: 0, green: 0, orange: 0, purple: 0 };

    const yRowPoints = [10, 14, 16, 20];
    [s.yellow.row0, s.yellow.row1, s.yellow.row2, s.yellow.row3].forEach((row, i) => {
      if (row.filter(m => m).length === 4) scores.yellow += yRowPoints[i];
    });

    const bCount = s.blue.marks.filter(m => m).length;
    const bScores = [0, 1, 2, 4, 7, 11, 16, 22, 29, 37, 46, 56];
    scores.blue = bScores[bCount];

    const gCount = s.green.marks.filter(m => m).length;
    const gScores = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66];
    scores.green = gScores[gCount];

    const oMultipliers = [1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 3];
    scores.orange = s.orange.values.reduce((sum, val, idx) => sum + (val * oMultipliers[idx]), 0);
    scores.purple = s.purple.values.reduce((sum, val) => sum + val, 0);

    const minScore = Math.min(scores.yellow, scores.blue, scores.green, scores.orange, scores.purple);
    player.totalScore = scores.yellow + scores.blue + scores.green + scores.orange + scores.purple + (minScore * player.bonuses.foxes);
  }

  private getActivePlayer() {
    const ids = Array.from(this.state.players.keys());
    return this.state.players.get(ids[this.state.activePlayerIndex]);
  }

  private startNewTurn() {
    this.state.phase = "ROLLING";
    this.state.remainingRolls = 3;
    this.state.pool.clear();
    this.state.selected.clear();
    this.state.silverPlatter.clear();
    this.DIE_COLORS.forEach(color => {
      this.state.pool.push(new Die(color, color, 1));
    });
  }

  private doRoll() {
    this.state.pool.forEach(die => {
      die.value = Math.floor(Math.random() * 6) + 1;
    });
    this.state.remainingRolls--;
    this.state.phase = "SELECTING";
  }

  private doSelect(dieId: string) {
    const dieIndex = this.state.pool.findIndex(d => d.id === dieId);
    if (dieIndex === -1) return;

    const selectedDie = this.state.pool[dieIndex];
    this.state.selected.push(selectedDie);
    
    const toSilverPlatter: number[] = [];
    this.state.pool.forEach((die, index) => {
      if (index !== dieIndex && die.value < selectedDie.value) {
        toSilverPlatter.push(index);
      }
    });

    [...toSilverPlatter, dieIndex].sort((a, b) => b - a).forEach(idx => {
      const die = this.state.pool[idx];
      if (idx !== dieIndex) {
        this.state.silverPlatter.push(die);
      }
      this.state.pool.splice(idx, 1);
    });

    if (this.state.selected.length >= 3 || this.state.pool.length === 0) {
      this.state.phase = "PASSIVE_CHOOSING";
    } else {
      this.state.phase = "ROLLING";
    }
  }

  onJoin(client: Client, options: any) {
    console.log(`[Clever] Player ${options.name} (${client.sessionId}) joined!`);
    const player = new PlayerState(client.sessionId, options.name || "Anonymous");
    this.state.players.set(client.sessionId, player);
    if (this.state.players.size === 1) {
      this.state.phase = "WAITING";
    }
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
  }

  onDispose() {}
}
