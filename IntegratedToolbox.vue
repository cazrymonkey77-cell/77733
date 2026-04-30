<template>
  <div class="toolbox-app">
    <nav class="nav-bar">
      <!-- 導覽按鈕保留... -->
    </nav>

    <main class="content-area">
      <transition name="fade" mode="out-in">
        <section v-if="isToolboxTab" :key="currentTab" class="tool-section">
          <Lottery v-if="currentTab === 'lottery'" />
          <Scoreboard v-else-if="currentTab === 'score'" />
          <Timer v-else-if="currentTab === 'timer'" />
        </section>

        <section v-else-if="currentTab === 'exam'" key="exam" class="tool-section">
          <Exam />
        </section>
      </transition>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Lottery from '../Lottery.vue';
import Scoreboard from '../Scoreboard.vue';
import Timer from '../Timer.vue';
import Exam from '../Exam.vue';

const currentTab = ref('lottery'); // 預設顯示抽籤機
const toolboxTabs = [
  { id: 'lottery', name: '隨機抽籤' },
  { id: 'score', name: '小組計分' },
  { id: 'timer', name: '計時器' }
];
const isToolboxTab = computed(() => ['lottery', 'score', 'timer'].includes(currentTab.value));
</script>

<style scoped>
.toolbox-app { font-family: sans-serif; max-width: 1000px; margin: 0 auto; background: #f9f9f9; min-height: 100vh; }

/* 導覽列 */
.nav-bar { display: flex; align-items: center; background: #333; padding: 12px 20px; gap: 15px; }
.nav-group { display: flex; align-items: center; gap: 8px; }
.nav-label { color: #aaa; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; }
.nav-separator { width: 1px; height: 24px; background: #555; margin: 0 10px; }
.nav-bar button { padding: 8px 16px; border: none; background: #444; color: #ccc; border-radius: 4px; cursor: pointer; transition: all 0.3s; }
.nav-bar button.active { background: #42b983; }
.nav-bar button:hover:not(.active) { background: #555; color: white; }

/* 內容區通用 */
.content-area { padding: 30px; }
.tool-section { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
h2 { margin-top: 0; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
button { cursor: pointer; padding: 8px 16px; border-radius: 6px; border: 1px solid #ddd; background: white; transition: 0.2s; }
.btn-primary { background: #42b983; color: white; border: none; }
.btn-primary:hover { background: #3aa876; }

/* 抽籤樣式 */
.lottery-layout { display: flex; flex-direction: column; gap: 20px; }
textarea { width: 100%; height: 80px; padding: 10px; border-radius: 8px; border: 1px solid #ccc; }
.display-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.candidate-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; list-style: none; }
.candidate-list li { background: #eee; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; }

/* 計分板樣式 */
.teams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
.team-card { border: 1px solid #eee; padding: 15px; border-radius: 10px; }
.score-text { font-size: 1.5rem; color: #42b983; }
.progress-bar { height: 8px; background: #eee; border-radius: 4px; margin: 15px 0; overflow: hidden; }
.progress { height: 100%; background: #42b983; transition: width 0.3s; }

/* 計時器樣式 */
.timer-view { text-align: center; }
.time-display { font-size: 5rem; font-family: monospace; margin: 30px 0; }
.urgent { background: #ffebeb; color: #e74c3c; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.7; } }

/* 測驗樣式 */
.question-block { margin-bottom: 20px; padding: 15px; background: #fdfdfd; border-radius: 8px; }
.options label { display: block; margin: 8px 0; cursor: pointer; }
.score-circle { font-size: 4rem; font-weight: bold; color: #42b983; }

/* 動畫效果 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pop-enter-active { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes pop-in { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(10px); }
</style>
<template>
  <div class="lottery-container">
    <h2>隨機抽籤機</h2>
    <div class="input-section">
      <textarea v-model="newNameInput" placeholder="輸入名單 (以換行分隔)"></textarea>
      <button class="btn-import" @click="importNames">匯入名單</button>
    </div>

    <div class="action-section">
      <button @click="drawCandidate" :disabled="candidates.length === 0" class="btn-primary">開始抽籤</button>
      <button @click="resetLottery">重設</button>
    </div>

    <div class="display-area">
      <h3>剩餘名單 ({{ candidates.length }})</h3>
      <TransitionGroup name="list" tag="ul" class="candidate-list">
        <li v-for="name in candidates" :key="name">{{ name }}</li>
      </TransitionGroup>
    </div>

    <div class="excluded-area">
      <h3>已抽中名單</h3>
      <ul>
        <li v-for="name in excludedList" :key="name">{{ name }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const newNameInput = ref('');
const candidates = ref(['王小明', '李華', '張強', '趙美']);
const excludedList = ref([]);

const importNames = () => {
  if (!newNameInput.value.trim()) return;
  candidates.value = newNameInput.value.split('\n').filter(n => n.trim());
  excludedList.value = [];
  newNameInput.value = '';
};

const drawCandidate = () => {
  if (candidates.value.length === 0) return;
  const randomIndex = Math.floor(Math.random() * candidates.value.length);
  const picked = candidates.value.splice(randomIndex, 1)[0];
  excludedList.value.push(picked);
};

const resetLottery = () => {
  candidates.value = [...candidates.value, ...excludedList.value];
  excludedList.value = [];
};
</script>

<style scoped>
.lottery-container { 
  max-width: 800px; 
  margin: 0 auto; 
  padding: 20px; 
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.input-section { display: flex; flex-direction: column; gap: 10px; }
textarea { width: 100%; height: 120px; padding: 10px; border-radius: 8px; border: 1px solid #ddd; }
.btn-import { align-self: flex-end; }

.list-enter-active, .list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.candidate-list { display: flex; flex-wrap: wrap; list-style: none; gap: 10px; }
.candidate-list li { background: #e0e0e0; padding: 5px 10px; border-radius: 4px; }
</style>
<template>
  <div class="scoreboard">
    <h2>小組計分板</h2>
    <div v-for="team in sortedTeams" :key="team.id" class="team-card">
      <div class="team-info">
        <span>{{ team.name }}</span>
        <strong>{{ team.score }} 分</strong>
      </div>
      <div class="progress-bar">
        <!-- v-bind 動態綁定寬度 -->
        <div class="progress" :style="{ width: team.score + '%' }"></div>
      </div>
      <div class="controls">
        <button @click="team.score += 5">+5</button>
        <button @click="team.score = Math.max(0, team.score - 5)">-5</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const teams = ref([
  { id: 1, name: '第一組', score: 0 },
  { id: 2, name: '第二組', score: 0 },
  { id: 3, name: '第三組', score: 0 },
]);

// 即時排序邏輯
const sortedTeams = computed(() => {
  return [...teams.value].sort((a, b) => b.score - a.score);
});
</script>

<style scoped>
.team-card {
  margin-bottom: 15px;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.progress-bar {
  height: 10px;
  background: #eee;
  border-radius: 5px;
  margin: 10px 0;
}
.progress {
  height: 100%;
  background: #42b983;
  transition: width 0.3s ease;
}
button { margin-right: 5px; }
</style>
<template>
  <div class="timer-container" :class="{ 'urgent': timeLeft < 10 && timeLeft > 0 }">
    <h2>計時器</h2>
    <div class="time-display">{{ formatTime }}</div>
    
    <div class="controls">
      <input type="number" v-model="initialTime" :disabled="isRunning" />
      <button @click="toggleTimer">{{ isRunning ? '暫停' : '開始' }}</button>
      <button @click="resetTimer">重設</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

const initialTime = ref(60);
const timeLeft = ref(60);
const isRunning = ref(false);
let timerInterval = null;

const formatTime = computed(() => {
  const mins = Math.floor(timeLeft.value / 60);
  const secs = timeLeft.value % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

const toggleTimer = () => {
  if (isRunning.value) {
    clearInterval(timerInterval);
  } else {
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--;
      } else {
        clearInterval(timerInterval);
        isRunning.value = false;
        alert('時間到！');
      }
    }, 1000);
  }
  isRunning.value = !isRunning.value;
};

const resetTimer = () => {
  clearInterval(timerInterval);
  isRunning.value = false;
  timeLeft.value = initialTime.value;
};

onUnmounted(() => clearInterval(timerInterval));
</script>

<style scoped>
.timer-container { text-align: center; padding: 20px; transition: background 0.3s; }
.time-display { font-size: 3rem; font-weight: bold; }
.urgent { background-color: #ffcccc; color: red; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.5; } }
input { width: 60px; margin-right: 10px; }
</style>
<template>
  <div class="exam-system">
    <div v-if="!submitted">
      <h2>隨堂測驗</h2>
      <div v-for="(q, index) in questions" :key="q.id" class="question">
        <p>{{ index + 1 }}. {{ q.text }}</p>
        
        <!-- 單選/是非題 -->
        <div v-if="q.type === 'single'">
          <label v-for="option in q.options" :key="option">
            <input type="radio" :value="option" v-model="userAnswers[q.id]"> {{ option }}
          </label>
        </div>

        <!-- 複選題 -->
        <div v-if="q.type === 'multiple'">
          <label v-for="option in q.options" :key="option">
            <input type="checkbox" :value="option" v-model="userAnswers[q.id]"> {{ option }}
          </label>
        </div>
      </div>
      <button @click="checkAnswers">提交測驗</button>
    </div>

    <div v-else class="result">
      <h2>測驗結果：{{ score }} 分</h2>
      <button @click="submitted = false; userAnswers = {}">重新挑戰</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 實際開發時可從 questions.json 匯入
const questions = ref([
  { id: 1, type: 'single', text: 'Vue 是哪種框架？', options: ['React', 'Vue', 'Angular'], answer: 'Vue' },
  { id: 2, type: 'multiple', text: '哪些是 Vue 的指令？', options: ['v-if', 'v-for', 'v-react'], answer: ['v-if', 'v-for'] }
]);

const userAnswers = ref({});
const submitted = ref(false);
const score = ref(0);

const checkAnswers = () => {
  let correctCount = 0;
  questions.value.forEach(q => {
    const userAns = userAnswers.value[q.id];
    if (q.type === 'single' && userAns === q.answer) {
      correctCount++;
    } else if (q.type === 'multiple' && Array.isArray(userAns)) {
      if (JSON.stringify(userAns.sort()) === JSON.stringify(q.answer.sort())) {
        correctCount++;
      }
    }
  });
  score.value = Math.round((correctCount / questions.value.length) * 100);
  submitted.value = true;
};
</script>

<style scoped>
.question { margin-bottom: 20px; text-align: left; }
label { display: block; margin: 5px 0; }
.result { text-align: center; }
</style>
<template>
  <div class="toolbox-app">
    <nav class="nav-bar">
      <!-- 導覽按鈕保留... -->
    </nav>

    <main class="content-area">
      <transition name="fade" mode="out-in">
        <section v-if="isToolboxTab" :key="currentTab" class="tool-section">
          <Lottery v-if="currentTab === 'lottery'" />
          <Scoreboard v-else-if="currentTab === 'score'" />
          <Timer v-else-if="currentTab === 'timer'" />
        </section>

        <section v-else-if="currentTab === 'exam'" key="exam" class="tool-section">
          <Exam />
        </section>
      </transition>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Lottery from '../Lottery.vue';
import Scoreboard from '../Scoreboard.vue';
import Timer from '../Timer.vue';
import Exam from '../Exam.vue';

const currentTab = ref('lottery'); // 預設顯示抽籤機
const toolboxTabs = [
  { id: 'lottery', name: '隨機抽籤' },
  { id: 'score', name: '小組計分' },
  { id: 'timer', name: '計時器' }
];
const isToolboxTab = computed(() => ['lottery', 'score', 'timer'].includes(currentTab.value));
</script>

<style scoped>
.toolbox-app { font-family: sans-serif; max-width: 1000px; margin: 0 auto; background: #f9f9f9; min-height: 100vh; }

/* 導覽列 */
.nav-bar { display: flex; align-items: center; background: #333; padding: 12px 20px; gap: 15px; }
.nav-group { display: flex; align-items: center; gap: 8px; }
.nav-label { color: #aaa; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; }
.nav-separator { width: 1px; height: 24px; background: #555; margin: 0 10px; }
.nav-bar button { padding: 8px 16px; border: none; background: #444; color: #ccc; border-radius: 4px; cursor: pointer; transition: all 0.3s; }
.nav-bar button.active { background: #42b983; }
.nav-bar button:hover:not(.active) { background: #555; color: white; }

/* 內容區通用 */
.content-area { padding: 30px; }
.tool-section { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
h2 { margin-top: 0; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
button { cursor: pointer; padding: 8px 16px; border-radius: 6px; border: 1px solid #ddd; background: white; transition: 0.2s; }
.btn-primary { background: #42b983; color: white; border: none; }
.btn-primary:hover { background: #3aa876; }

/* 抽籤樣式 */
.lottery-layout { display: flex; flex-direction: column; gap: 20px; }
textarea { width: 100%; height: 80px; padding: 10px; border-radius: 8px; border: 1px solid #ccc; }
.display-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.candidate-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; list-style: none; }
.candidate-list li { background: #eee; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; }

/* 計分板樣式 */
.teams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
.team-card { border: 1px solid #eee; padding: 15px; border-radius: 10px; }
.score-text { font-size: 1.5rem; color: #42b983; }
.progress-bar { height: 8px; background: #eee; border-radius: 4px; margin: 15px 0; overflow: hidden; }
.progress { height: 100%; background: #42b983; transition: width 0.3s; }

/* 計時器樣式 */
.timer-view { text-align: center; }
.time-display { font-size: 5rem; font-family: monospace; margin: 30px 0; }
.urgent { background: #ffebeb; color: #e74c3c; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.7; } }

/* 測驗樣式 */
.question-block { margin-bottom: 20px; padding: 15px; background: #fdfdfd; border-radius: 8px; }
.options label { display: block; margin: 8px 0; cursor: pointer; }
.score-circle { font-size: 4rem; font-weight: bold; color: #42b983; }

/* 動畫效果 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pop-enter-active { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes pop-in { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(10px); }
</style>
<template>
  <div class="timer-container" :class="{ 'urgent': timeLeft < 10 && timeLeft > 0 }">
    <h2>計時器</h2>
    <div class="time-display">{{ formatTime }}</div>
    
    <div class="controls">
      <input type="number" v-model="initialTime" :disabled="isRunning" />
      <button @click="toggleTimer">{{ isRunning ? '暫停' : '開始' }}</button>
      <button @click="resetTimer">重設</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';

const initialTime = ref(60);
const timeLeft = ref(60);
const isRunning = ref(false);
let timerInterval = null;

const formatTime = computed(() => {
  const mins = Math.floor(timeLeft.value / 60);
  const secs = timeLeft.value % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

const toggleTimer = () => {
  if (isRunning.value) {
    clearInterval(timerInterval);
  } else {
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--;
      } else {
        clearInterval(timerInterval);
        isRunning.value = false;
        alert('時間到！');
      }
    }, 1000);
  }
  isRunning.value = !isRunning.value;
};

const resetTimer = () => {
  clearInterval(timerInterval);
  isRunning.value = false;
  timeLeft.value = initialTime.value;
};

// 使用 watch 監控剩餘秒數，觸發警示邏輯
watch(timeLeft, (newVal) => {
  if (newVal === 0) {
    // 這裡可以觸發音效邏輯
    console.log("倒數結束！播放鈴聲...");
  }
});

onUnmounted(() => clearInterval(timerInterval));
</script>

<style scoped>
.timer-container { text-align: center; padding: 20px; transition: background 0.3s; border-radius: 12px; }
.time-display { font-size: 5rem; font-family: monospace; font-weight: bold; margin: 20px 0; }
.urgent { background-color: #ffcccc; color: red; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.5; } }
.controls { display: flex; justify-content: center; align-items: center; gap: 15px; }
input { width: 80px; padding: 10px; font-size: 1.2rem; border-radius: 8px; border: 1px solid #ccc; }
button { padding: 10px 20px; font-size: 1.1rem; }
</style>