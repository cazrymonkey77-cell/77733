<template>
  <div class="lottery-container">
    <h2>隨機抽籤機</h2>
    <div class="input-section">
      <textarea v-model="newNameInput" placeholder="輸入名單 (以換行分隔)"></textarea>
      <button @click="importNames">匯入名單</button>
    </div>

    <div class="action-section">
      <button @click="drawCandidate" :disabled="candidates.length === 0">開始抽籤</button>
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
.list-enter-active, .list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.lottery-container { padding: 20px; border: 1px solid #ccc; }
textarea { width: 100%; height: 100px; margin-bottom: 10px; }
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
