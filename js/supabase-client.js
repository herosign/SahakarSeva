// ============================================================
// Sahakar Seva — Supabase Client & Demo Mode
// ============================================================
// TO CONNECT TO REAL SUPABASE:
// 1. Go to your Supabase project dashboard (https://supabase.com/dashboard)
// 2. Go to Settings > API
// 3. Copy your Project URL and anon/public key
// 4. Paste them below and set DEMO_MODE = false
// ============================================================

// Supabase credentials (connected)
const SUPABASE_URL = 'https://jmmswyysqivrzeixinwx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbXN3eXlzcWl2cnplaXhpbnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTQxMzgsImV4cCI6MjEwNjIzMDEzOH0.EVifSMoATeM8OGz6uyt_ghEu7le5nVX3YcNA9ChBGIo';

// Set to false when you have real Supabase credentials above
const DEMO_MODE = true;

// Initialize real Supabase client (only when DEMO_MODE is false)
let supabaseClient = null;
if (!DEMO_MODE && typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// --- Mock Data (used when DEMO_MODE = true) ---
const MOCK_DATA = {
  currentUser: null,
  users: [
    {id:'c1', email:'ravi@test.com', role:'customer', name:'Ravi Kumar', phone:'9876543210', lang:'hi'},
    {id:'c2', email:'priya@test.com', role:'customer', name:'Priya Sharma', phone:'9876543211', lang:'en'},
    {id:'w1', email:'suresh@test.com', role:'worker', name:'Suresh Yadav', phone:'9876543212', lang:'hi'},
    {id:'w2', email:'ramesh@test.com', role:'worker', name:'Ramesh Nair', phone:'9876543213', lang:'ta'},
    {id:'w3', email:'deepak@test.com', role:'worker', name:'Deepak Singh', phone:'9876543214', lang:'en'},
    {id:'a1', email:'admin@sahakarseva.in', role:'admin', name:'Federation Admin', phone:'9876543200', lang:'en'}
  ],
  societies: [
    {id:'s1', name:'Jan Seva Society #12', registrationNo:'SOC-2024-0012', address:'Sector 15, Noida', lat:28.5855, lng:77.31, federationId:'f1'},
    {id:'s2', name:'Shramik Sahayog Society #7', registrationNo:'SOC-2024-0007', address:'Lajpat Nagar, Delhi', lat:28.57, lng:77.24, federationId:'f1'},
    {id:'s3', name:'Kisan Mazdoor Society #3', registrationNo:'SOC-2024-0003', address:'Dwarka, Delhi', lat:28.5921, lng:77.046, federationId:'f1'}
  ],
  workerProfiles: [
    {id:'w1', societyId:'s1', trade:'Electrician', itiCertUrl:'/demo-cert.pdf', approved:true, lat:28.59, lng:77.31, joinedAt:'2024-06-15', totalJobs:47, completedJobs:45},
    {id:'w2', societyId:'s2', trade:'Plumber', itiCertUrl:'/demo-cert.pdf', approved:true, lat:28.57, lng:77.25, joinedAt:'2025-01-10', totalJobs:23, completedJobs:22},
    {id:'w3', societyId:'s1', trade:'AC Repair', itiCertUrl:null, approved:false, lat:28.58, lng:77.30, joinedAt:'2026-09-20', totalJobs:0, completedJobs:0}
  ],
  wageFloors: [
    {trade:'Electrician', minAmount:350}, {trade:'Plumber', minAmount:300}, {trade:'Carpenter', minAmount:300},
    {trade:'Mason', minAmount:320}, {trade:'AC Repair', minAmount:350}, {trade:'Cleaning', minAmount:250}
  ],
  jobs: [
    {id:'j1', customerId:'c1', trade:'Electrician', offer:400, description:'Fix ceiling fan and install new switch board', address:'Sector 62, Noida', lat:28.6270, lng:77.3650, status:'open', assignedWorkerId:null, acceptedBidId:null, createdAt:'2026-09-29T08:30:00'},
    {id:'j2', customerId:'c2', trade:'Plumber', offer:350, description:'Fix leaking kitchen tap and replace pipe', address:'Greater Kailash, Delhi', lat:28.5494, lng:77.2436, status:'assigned', assignedWorkerId:'w2', acceptedBidId:'b3', createdAt:'2026-09-29T07:00:00'},
    {id:'j3', customerId:'c1', trade:'AC Repair', offer:500, description:'AC not cooling, service needed', address:'Sector 18, Noida', lat:28.5700, lng:77.3250, status:'completed', assignedWorkerId:'w1', acceptedBidId:'b5', createdAt:'2026-09-28T14:00:00'}
  ],
  bids: [
    {id:'b1', jobId:'j1', workerId:'w1', amount:400, isCounter:false, createdAt:'2026-09-29T08:35:00'},
    {id:'b2', jobId:'j1', workerId:'w2', amount:450, isCounter:true, createdAt:'2026-09-29T08:40:00'},
    {id:'b3', jobId:'j2', workerId:'w2', amount:350, isCounter:false, createdAt:'2026-09-29T07:10:00'},
    {id:'b4', jobId:'j1', workerId:'w3', amount:420, isCounter:true, createdAt:'2026-09-29T08:45:00'},
    {id:'b5', jobId:'j3', workerId:'w1', amount:500, isCounter:false, createdAt:'2026-09-28T14:15:00'}
  ],
  ratings: [
    {jobId:'j3', workerId:'w1', customerId:'c1', stars:5, review:'Excellent work, very professional'}
  ],
  welfareAccounts: [
    {workerId:'w1', pfBalance:2340, poolBalance:580}, {workerId:'w2', pfBalance:890, poolBalance:210}
  ],
  insurancePolicies: [
    {workerId:'w1', scheme:'PMSBY', policyNo:'PMSBY-2025-4472', validTill:'2027-05-31'},
    {workerId:'w1', scheme:'Cooperative Health', policyNo:'COOP-H-1189', validTill:'2026-12-31'}
  ],
  invoices: [
    {jobId:'j3', baseFare:500, discount:0, welfareContribution:10, platformFee:0, tip:50, total:510, workerReceives:550, createdAt:'2026-09-28T16:00:00'}
  ],
  grievances: [
    {id:'g1', userId:'w1', subject:'Payment delayed', body:'My payment for job on Sept 25 has not been credited', status:'open', createdAt:'2026-09-27'}
  ],
  sosAlerts: [
    {id:'sos1', userId:'w2', lat:28.57, lng:77.25, resolved:false, createdAt:'2026-09-29T06:00:00'}
  ],
  settings: {platform_fee: '0', welfare_pct: '2'},
  demandHistory: [
    {trade:'Electrician', date:'2026-09-30', demand:12}, {trade:'Electrician', date:'2026-10-01', demand:15},
    {trade:'Electrician', date:'2026-10-02', demand:9}, {trade:'Electrician', date:'2026-10-03', demand:18},
    {trade:'Electrician', date:'2026-10-04', demand:22}, {trade:'Electrician', date:'2026-10-05', demand:14},
    {trade:'Electrician', date:'2026-10-06', demand:8}, {trade:'Plumber', date:'2026-09-30', demand:8},
    {trade:'Plumber', date:'2026-10-01', demand:10}, {trade:'Plumber', date:'2026-10-02', demand:7},
    {trade:'Plumber', date:'2026-10-03', demand:11}, {trade:'Plumber', date:'2026-10-04', demand:15},
    {trade:'Plumber', date:'2026-10-05', demand:9}, {trade:'Plumber', date:'2026-10-06', demand:6}
  ]
};

// Restore session from localStorage
try {
  const savedUser = localStorage.getItem('sahakar_user');
  if (savedUser) {
    MOCK_DATA.currentUser = JSON.parse(savedUser);
  }
} catch(e) {}

// --- SahakarDB API ---
window.SahakarDB = {
  getCurrentUser: async () => MOCK_DATA.currentUser,
  
  signUp: async (email, password, role, name) => {
    const user = {id: 'u' + Date.now(), email, role, name, phone: '', lang: 'en'};
    MOCK_DATA.users.push(user);
    MOCK_DATA.currentUser = user;
    localStorage.setItem('sahakar_user', JSON.stringify(user));
    return user;
  },
  
  signIn: async (email, password) => {
    const user = MOCK_DATA.users.find(u => u.email === email);
    if (!user) throw new Error('User not found');
    MOCK_DATA.currentUser = user;
    localStorage.setItem('sahakar_user', JSON.stringify(user));
    return user;
  },
  
  signOut: async () => {
    MOCK_DATA.currentUser = null;
    localStorage.removeItem('sahakar_user');
  },
  
  onAuthChange: (callback) => {
    callback(MOCK_DATA.currentUser);
  },
  
  getOpenJobs: async (trade) => {
    let jobs = MOCK_DATA.jobs.filter(j => j.status === 'open');
    if (trade) jobs = jobs.filter(j => j.trade === trade);
    return jobs;
  },
  
  getMyJobs: async (userId) => {
    return MOCK_DATA.jobs.filter(j => j.customerId === userId || j.assignedWorkerId === userId);
  },
  
  createJob: async ({trade, offer, description, address, lat, lng}) => {
    const floor = MOCK_DATA.wageFloors.find(w => w.trade === trade)?.minAmount || 0;
    if (offer < floor) throw {code:'FAIR_WAGE_FLOOR_VIOLATION', message: 'Below floor', floor};
    const job = {id: 'j'+Date.now(), customerId: MOCK_DATA.currentUser?.id, trade, offer, description, address, lat, lng, status:'open', assignedWorkerId:null, acceptedBidId:null, createdAt: new Date().toISOString()};
    MOCK_DATA.jobs.push(job);
    return job;
  },
  
  updateJobStatus: async (jobId, status) => {
    const job = MOCK_DATA.jobs.find(j => j.id === jobId);
    if (job) job.status = status;
    return job;
  },
  
  getBidsForJob: async (jobId) => {
    return MOCK_DATA.bids.filter(b => b.jobId === jobId).map(b => {
      const worker = MOCK_DATA.users.find(u => u.id === b.workerId);
      const profile = MOCK_DATA.workerProfiles.find(p => p.id === b.workerId);
      const society = MOCK_DATA.societies.find(s => s.id === profile?.societyId);
      return {...b, workerName: worker?.name, societyName: society?.name, trade: profile?.trade, trustScore: 90, distance: (Math.random()*4.5 + 0.5).toFixed(1), eta: Math.floor(Math.random()*20+5)};
    });
  },
  
  createBid: async (jobId, amount, isCounter) => {
    const job = MOCK_DATA.jobs.find(j => j.id === jobId);
    const floor = MOCK_DATA.wageFloors.find(w => w.trade === job?.trade)?.minAmount || 0;
    if (amount < floor) throw {code:'FAIR_WAGE_FLOOR_VIOLATION', message: 'Below floor', floor};
    const bid = {id:'b'+Date.now(), jobId, workerId: MOCK_DATA.currentUser?.id, amount, isCounter, createdAt: new Date().toISOString()};
    MOCK_DATA.bids.push(bid);
    return bid;
  },
  
  acceptBid: async (bidId) => {
    const bid = MOCK_DATA.bids.find(b => b.id === bidId);
    if (!bid) return;
    const job = MOCK_DATA.jobs.find(j => j.id === bid.jobId);
    if (job) {
      job.status = 'assigned';
      job.assignedWorkerId = bid.workerId;
      job.acceptedBidId = bid.id;
    }
  },
  
  subscribeToJobBids: (jobId, callback) => {
    const interval = setInterval(() => {
      const worker = MOCK_DATA.users.filter(u => u.role === 'worker')[Math.floor(Math.random()*3)];
      MOCK_DATA.bids.push({id:'b'+Date.now(), jobId, workerId: worker.id, amount: 400 + Math.floor(Math.random()*50), isCounter:true, createdAt: new Date().toISOString()});
      window.SahakarDB.getBidsForJob(jobId).then(callback);
    }, 5000);
    window.SahakarDB.getBidsForJob(jobId).then(callback);
    return () => clearInterval(interval);
  },
  
  subscribeToOpenJobs: (callback) => {
    const interval = setInterval(() => {
      window.SahakarDB.getOpenJobs().then(callback);
    }, 8000);
    window.SahakarDB.getOpenJobs().then(callback);
    return () => clearInterval(interval);
  },
  
  getWorkerProfile: async (userId) => {
    const p = MOCK_DATA.workerProfiles.find(p => p.id === userId);
    if(p) p.societyName = MOCK_DATA.societies.find(s=>s.id === p.societyId)?.name;
    return p;
  },
  
  submitWorkerProfile: async ({trade, societyId, itiCertUrl}) => {
    const p = {id: MOCK_DATA.currentUser?.id, societyId, trade, itiCertUrl, approved:false, lat:0, lng:0, joinedAt:new Date().toISOString(), totalJobs:0, completedJobs:0};
    MOCK_DATA.workerProfiles.push(p);
    return p;
  },
  
  getPendingWorkers: async () => {
    return MOCK_DATA.workerProfiles.filter(p => !p.approved).map(p => {
      const u = MOCK_DATA.users.find(u => u.id === p.id);
      const s = MOCK_DATA.societies.find(s => s.id === p.societyId);
      return {...p, user: u, society: s};
    });
  },
  
  approveWorker: async (userId) => {
    const p = MOCK_DATA.workerProfiles.find(p => p.id === userId);
    if (p) p.approved = true;
  },
  
  getWelfareAccount: async (userId) => MOCK_DATA.welfareAccounts.find(w => w.workerId === userId) || {workerId: userId, pfBalance: 0, poolBalance: 0},
  getInsurancePolicies: async (userId) => MOCK_DATA.insurancePolicies.filter(i => i.workerId === userId),
  
  getTrustScore: async (userId) => {
    return {overall: 85, avgRating: 4.5, completionRate: 90, tenureYears: 1, ratingComponent: 54, completionComponent: 27, tenureComponent: 4};
  },
  
  submitRating: async (jobId, workerId, stars, tip) => {
    MOCK_DATA.ratings.push({jobId, workerId, customerId: MOCK_DATA.currentUser?.id, stars, review:''});
    const job = MOCK_DATA.jobs.find(j => j.id === jobId);
    const bid = MOCK_DATA.bids.find(b => b.id === job?.acceptedBidId);
    if (job && bid) {
      window.SahakarDB.createInvoice(jobId, tip);
    }
  },
  
  getWageFloors: async () => MOCK_DATA.wageFloors,
  updateWageFloor: async (trade, amount) => {
    const f = MOCK_DATA.wageFloors.find(w => w.trade === trade);
    if (f) f.minAmount = amount;
  },
  getSettings: async () => MOCK_DATA.settings,
  updateSettings: async (key, value) => MOCK_DATA.settings[key] = value,
  getSosAlerts: async () => MOCK_DATA.sosAlerts,
  getGrievances: async () => MOCK_DATA.grievances,
  submitGrievance: async (subject, body) => MOCK_DATA.grievances.push({id:'g'+Date.now(), userId: MOCK_DATA.currentUser?.id, subject, body, status:'open', createdAt: new Date().toISOString()}),
  submitSos: async (lat, lng) => MOCK_DATA.sosAlerts.push({id:'sos'+Date.now(), userId: MOCK_DATA.currentUser?.id, lat, lng, resolved:false, createdAt: new Date().toISOString()}),
  getSocieties: async () => MOCK_DATA.societies,
  
  getDemandForecast: async (trade) => {
    const data = MOCK_DATA.demandHistory.filter(d => d.trade === trade);
    return data.map(d => ({...d, shift_advice: d.demand > 10 ? 'High Demand Expected' : 'Normal Demand'}));
  },
  
  parseBooking: async (text) => {
    const t = text.toLowerCase();
    let service_type = 'Plumber';
    if(t.includes('ac')) service_type = 'AC Repair';
    if(t.includes('electric') || t.includes('fan') || t.includes('light')) service_type = 'Electrician';
    let budget = text.match(/\d+/) ? parseInt(text.match(/\d+/)[0]) : null;
    return {service_type, location: 'Detected from your area', budget, urgency: 'normal'};
  },
  
  createInvoice: async (jobId, tip) => {
    const job = MOCK_DATA.jobs.find(j => j.id === jobId);
    const bid = MOCK_DATA.bids.find(b => b.id === job?.acceptedBidId);
    if(job && bid) {
      const baseFare = bid.amount;
      const welfareContribution = baseFare * (parseFloat(MOCK_DATA.settings.welfare_pct) / 100);
      const platformFee = parseFloat(MOCK_DATA.settings.platform_fee);
      const total = baseFare + welfareContribution + platformFee;
      const inv = {jobId, baseFare, discount:0, welfareContribution, platformFee, tip, total, workerReceives: baseFare + tip, createdAt: new Date().toISOString()};
      MOCK_DATA.invoices.push(inv);
      return inv;
    }
  },
  
  getInvoice: async (jobId) => MOCK_DATA.invoices.find(i => i.jobId === jobId),
  
  getTradeIcon: async (trade) => {
    // Return a dummy SVG path
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>';
  }
};
