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
const DEMO_MODE = false;

// Initialize real Supabase client (only when DEMO_MODE is false)
let supabaseClient = null;
if (!DEMO_MODE && typeof supabase !== 'undefined') {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch(e) {
    console.warn('Failed to init supabaseClient', e);
  }
}

// --- Mock Data ---
const MOCK_DATA = {
  currentUser: null,
  users: [
    {id:'c1', email:'ravi@test.com', role:'customer', name:'Ravi Kumar', phone:'9876543210', lang:'hi'},
    {id:'w1', email:'suresh@test.com', role:'worker', name:'Suresh Yadav', phone:'9876543212', lang:'hi'}
  ],
  societies: [
    {id:'s1', name:'Jan Seva Society #12', registrationNo:'SOC-2024-0012', address:'Sector 15, Noida', lat:28.5855, lng:77.31, federationId:'f1'},
    {id:'s2', name:'Shramik Sahayog Society #7', registrationNo:'SOC-2024-0007', address:'Lajpat Nagar, Delhi', lat:28.57, lng:77.24, federationId:'f1'},
    {id:'s3', name:'Kisan Mazdoor Society #3', registrationNo:'SOC-2024-0003', address:'Dwarka, Delhi', lat:28.5921, lng:77.046, federationId:'f1'}
  ],
  workerProfiles: [
    {id:'w1', societyId:'s1', trade:'Electrician', itiCertUrl:'/demo-cert.pdf', approved:true, lat:28.59, lng:77.31, joinedAt:'2024-06-15', totalJobs:47, completedJobs:45}
  ],
  wageFloors: [
    {trade:'Electrician', minAmount:350}, {trade:'Plumber', minAmount:300}, {trade:'Carpenter', minAmount:300},
    {trade:'Mason', minAmount:320}, {trade:'AC Repair', minAmount:350}, {trade:'Cleaning', minAmount:250}
  ],
  jobs: [
    {id:'j1', customerId:'c1', customer_id:'c1', trade:'Electrician', offer:450, description:'Fix main switchboard and install ceiling fan', address:'Sector 62, Noida', lat:28.627, lng:77.365, status:'open', assignedWorkerId:null, acceptedBidId:null, createdAt: new Date(Date.now() - 3600000).toISOString()},
    {id:'j2', customerId:'c1', customer_id:'c1', trade:'Plumber', offer:350, description:'Kitchen sink pipe leakage repair', address:'Lajpat Nagar, Delhi', lat:28.57, lng:77.24, status:'open', assignedWorkerId:null, acceptedBidId:null, createdAt: new Date(Date.now() - 7200000).toISOString()}
  ],
  bids: [
    {id:'b1', jobId:'j1', job_id:'j1', workerId:'w1', worker_id:'w1', workerName:'Suresh Yadav', amount:450, isCounter:false, is_counter:false, distance:'1.8', eta:10, createdAt: new Date(Date.now() - 1800000).toISOString()}
  ],
  ratings: [],
  welfareAccounts: [{workerId:'w1', pfBalance:2340, poolBalance:580}],
  insurancePolicies: [
    {workerId:'w1', scheme:'PMSBY Accidental Insurance', policyNo:'PMSBY-2026-8812', validTill:'2027-05-31'},
    {workerId:'w1', scheme:'Cooperative Health Shield', policyNo:'COOP-H-9921', validTill:'2026-12-31'}
  ],
  invoices: [],
  grievances: [],
  sosAlerts: [],
  settings: {platform_fee: '0', welfare_pct: '2'},
  demandHistory: []
};

// --- Cross-Tab Local Storage Synchronization Helpers ---
function getLocalJobs() {
  try {
    const raw = localStorage.getItem('sahakar_shared_jobs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e) {}
  return [...MOCK_DATA.jobs];
}

function saveLocalJob(job) {
  try {
    const jobs = getLocalJobs();
    const idx = jobs.findIndex(j => j.id === job.id);
    if (idx >= 0) jobs[idx] = job;
    else jobs.unshift(job);
    localStorage.setItem('sahakar_shared_jobs', JSON.stringify(jobs));
    
    // Also sync in-memory
    const mIdx = MOCK_DATA.jobs.findIndex(j => j.id === job.id);
    if (mIdx >= 0) MOCK_DATA.jobs[mIdx] = job;
    else MOCK_DATA.jobs.unshift(job);
  } catch(e) {}
}

function updateLocalJob(jobId, updates) {
  try {
    const jobs = getLocalJobs();
    const j = jobs.find(x => x.id === jobId);
    if (j) {
      Object.assign(j, updates);
      localStorage.setItem('sahakar_shared_jobs', JSON.stringify(jobs));
    }
    const mj = MOCK_DATA.jobs.find(x => x.id === jobId);
    if (mj) Object.assign(mj, updates);
  } catch(e) {}
}

function deleteLocalJob(jobId) {
  try {
    const jobs = getLocalJobs().filter(x => x.id !== jobId);
    localStorage.setItem('sahakar_shared_jobs', JSON.stringify(jobs));
    MOCK_DATA.jobs = MOCK_DATA.jobs.filter(x => x.id !== jobId);
  } catch(e) {}
}

function getLocalBids() {
  try {
    const raw = localStorage.getItem('sahakar_shared_bids');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e) {}
  return [...MOCK_DATA.bids];
}

function saveLocalBid(bid) {
  try {
    const bids = getLocalBids();
    const idx = bids.findIndex(b => b.id === bid.id);
    if (idx >= 0) bids[idx] = bid;
    else bids.unshift(bid);
    localStorage.setItem('sahakar_shared_bids', JSON.stringify(bids));
    
    const mIdx = MOCK_DATA.bids.findIndex(b => b.id === bid.id);
    if (mIdx >= 0) MOCK_DATA.bids[mIdx] = bid;
    else MOCK_DATA.bids.unshift(bid);
  } catch(e) {}
}

// Restore session from localStorage
try {
  const savedUser = localStorage.getItem('sahakar_user');
  if (savedUser) {
    MOCK_DATA.currentUser = JSON.parse(savedUser);
  }
} catch(e) {}

// --- SahakarDB API ---
window.SahakarDB = {
  getCurrentUser: async () => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
          const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
          const role = profile?.role || session.user.user_metadata?.role || 'customer'; 
          const name = profile?.name || session.user.user_metadata?.name || session.user.email.split('@')[0];
          return profile || { id: session.user.id, email: session.user.email, role, name };
        }
      } catch(e) {
        console.warn('Supabase session fetch fallback:', e);
      }
    }
    return MOCK_DATA.currentUser;
  },
  
  signUp: async (email, password, role, name) => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { role, name }
          }
        });
        if (error) throw error;
        try {
          if (data?.user) {
            await supabaseClient.from('profiles').insert({
              id: data.user.id,
              role: role,
              name: name,
              email: email
            });
          }
        } catch(e){}
        const u = { id: data.user.id, email: data.user.email, role, name };
        MOCK_DATA.currentUser = u;
        localStorage.setItem('sahakar_user', JSON.stringify(u));
        return u;
      } catch(err) {
        console.warn('Supabase signUp fallback to local:', err);
      }
    }
    
    const user = {id: 'u_' + Date.now(), email, role, name, phone: '', lang: 'en'};
    MOCK_DATA.users.push(user);
    MOCK_DATA.currentUser = user;
    localStorage.setItem('sahakar_user', JSON.stringify(user));
    return user;
  },
  
  signIn: async (email, password) => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const cur = await window.SahakarDB.getCurrentUser();
        MOCK_DATA.currentUser = cur;
        localStorage.setItem('sahakar_user', JSON.stringify(cur));
        return cur;
      } catch(err) {
        console.warn('Supabase signIn fallback to local:', err);
      }
    }
    
    const user = MOCK_DATA.users.find(u => u.email === email) || {
      id: 'u_' + Date.now(),
      email,
      role: email.includes('worker') ? 'worker' : 'customer',
      name: email.split('@')[0],
      phone: ''
    };
    MOCK_DATA.currentUser = user;
    localStorage.setItem('sahakar_user', JSON.stringify(user));
    return user;
  },
  
  signOut: async () => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch(e){}
    }
    MOCK_DATA.currentUser = null;
    localStorage.removeItem('sahakar_user');
  },
  
  onAuthChange: (callback) => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
          if (session) {
            const user = await window.SahakarDB.getCurrentUser();
            callback(user);
          } else {
            callback(null);
          }
        });
      } catch(e){}
    }
    window.SahakarDB.getCurrentUser().then(callback);
  },
  
  getOpenJobs: async (trade) => {
    let cloudJobs = [];
    if (!DEMO_MODE && supabaseClient) {
      try {
        let query = supabaseClient.from('jobs').select('*').eq('status', 'open');
        if (trade) query = query.eq('trade', trade);
        const { data, error } = await query;
        if (!error && Array.isArray(data)) cloudJobs = data;
      } catch(e) {}
    }

    // Merge with local persistent jobs
    const localJobs = getLocalJobs().filter(j => j.status === 'open');
    const combined = [...localJobs];
    cloudJobs.forEach(cj => {
      if (!combined.some(lj => lj.id === cj.id)) combined.push(cj);
    });

    if (trade) {
      return combined.filter(j => j.trade.toLowerCase() === trade.toLowerCase());
    }
    return combined;
  },
  
  getMyJobs: async (userId) => {
    let cloudJobs = [];
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('jobs').select('*');
        if (!error && Array.isArray(data)) cloudJobs = data;
      } catch(e) {}
    }

    const localJobs = getLocalJobs();
    const combined = [...localJobs];
    cloudJobs.forEach(cj => {
      if (!combined.some(lj => lj.id === cj.id)) combined.push(cj);
    });

    if (userId) {
      return combined.filter(j => j.customerId === userId || j.customer_id === userId || j.assignedWorkerId === userId);
    }
    return combined;
  },

  getJob: async (jobId) => {
    if (!jobId) return null;
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('jobs').select('*').eq('id', jobId).single();
        if (!error && data) return data;
      } catch(e) {}
    }
    const local = getLocalJobs().find(j => j.id === jobId || j.jobId === jobId);
    if (local) return local;
    return MOCK_DATA.jobs.find(j => j.id === jobId) || null;
  },
  
  createJob: async ({trade, offer, description, address, lat, lng}) => {
    const floor = (MOCK_DATA.wageFloors.find(w => w.trade.toLowerCase() === trade.toLowerCase())?.minAmount) || 250;
    if (offer < floor) throw {code:'FAIR_WAGE_FLOOR_VIOLATION', message: `Below fair wage floor of ₹${floor}`, floor};

    let currentUser = await window.SahakarDB.getCurrentUser();
    let createdJob = null;

    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          const { data, error } = await supabaseClient.from('jobs').insert({
            customer_id: user.id,
            trade, offer, description, address, lat: lat || 28.627, lng: lng || 77.365, status: 'open'
          }).select().single();
          if (!error && data) createdJob = data;
        }
      } catch(err) {
        console.warn('Supabase createJob insert failed; local sync used:', err);
      }
    }

    const job = createdJob || {
      id: 'job_' + Date.now(),
      customerId: currentUser?.id || 'customer_1',
      customer_id: currentUser?.id || 'customer_1',
      trade,
      offer: parseInt(offer, 10),
      description,
      address,
      lat: lat || 28.627,
      lng: lng || 77.365,
      status: 'open',
      assignedWorkerId: null,
      acceptedBidId: null,
      createdAt: new Date().toISOString()
    };

    saveLocalJob(job);
    return job;
  },
  
  updateJobStatus: async (jobId, status) => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        await supabaseClient.from('jobs').update({ status }).eq('id', jobId);
      } catch(e) {}
    }
    updateLocalJob(jobId, { status });
    return true;
  },

  updateJob: async (jobId, { offer, description, address, trade }) => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        const payload = {};
        if (offer !== undefined) payload.offer = offer;
        if (description !== undefined) payload.description = description;
        if (address !== undefined) payload.address = address;
        if (trade !== undefined) payload.trade = trade;
        await supabaseClient.from('jobs').update(payload).eq('id', jobId);
      } catch(e) {}
    }
    updateLocalJob(jobId, { offer, description, address, trade });
    return true;
  },

  deleteJob: async (jobId) => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        await supabaseClient.from('jobs').delete().eq('id', jobId);
      } catch(e) {}
    }
    deleteLocalJob(jobId);
    return true;
  },
  
  getBidsForJob: async (jobId) => {
    let cloudBids = [];
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('bids').select('*').eq('job_id', jobId);
        if (!error && Array.isArray(data)) cloudBids = data;
      } catch(e) {}
    }

    const localBids = getLocalBids().filter(b => b.jobId === jobId || b.job_id === jobId);
    const combined = [...localBids];
    cloudBids.forEach(cb => {
      if (!combined.some(lb => lb.id === cb.id)) {
        combined.push({
          ...cb,
          workerName: cb.workerName || 'Suresh Yadav',
          distance: (Math.random()*2.5 + 0.8).toFixed(1),
          eta: Math.floor(Math.random()*12 + 5)
        });
      }
    });

    return combined;
  },
  
  createBid: async (jobId, amount, isCounter) => {
    const user = await window.SahakarDB.getCurrentUser();
    let cloudBid = null;

    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data: { authUser } } = await supabaseClient.auth.getUser();
        const uid = authUser?.id || user?.id;
        if (uid) {
          const { data, error } = await supabaseClient.from('bids').insert({
            job_id: jobId,
            worker_id: uid,
            amount: parseInt(amount, 10),
            is_counter: !!isCounter
          }).select().single();
          if (!error && data) cloudBid = data;
        }
      } catch(e) {}
    }

    const bid = cloudBid || {
      id: 'b_' + Date.now(),
      jobId,
      job_id: jobId,
      workerId: user?.id || 'w1',
      worker_id: user?.id || 'w1',
      workerName: user?.name || 'Suresh Yadav (Jan Seva)',
      amount: parseInt(amount, 10),
      isCounter: !!isCounter,
      is_counter: !!isCounter,
      distance: (Math.random()*2.2 + 0.8).toFixed(1),
      eta: Math.floor(Math.random()*12 + 5),
      createdAt: new Date().toISOString()
    };

    saveLocalBid(bid);
    return bid;
  },
  
  acceptBid: async (bidId) => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data: bid } = await supabaseClient.from('bids').select('*').eq('id', bidId).single();
        if (bid) {
          await supabaseClient.from('jobs').update({
            status: 'assigned',
            assigned_worker_id: bid.worker_id,
            accepted_bid_id: bid.id
          }).eq('id', bid.job_id);
        }
      } catch(e) {}
    }

    const bid = getLocalBids().find(b => b.id === bidId);
    if (bid) {
      const targetJobId = bid.jobId || bid.job_id;
      updateLocalJob(targetJobId, {
        status: 'assigned',
        assignedWorkerId: bid.workerId || bid.worker_id,
        acceptedBidId: bid.id
      });
    }
    return true;
  },
  
  subscribeToJobBids: (jobId, callback) => {
    window.SahakarDB.getBidsForJob(jobId).then(callback);
    const interval = setInterval(async () => {
      const bids = await window.SahakarDB.getBidsForJob(jobId);
      callback(bids);
    }, 2500);
    return () => clearInterval(interval);
  },
  
  subscribeToOpenJobs: (callback) => {
    window.SahakarDB.getOpenJobs().then(callback);
    const interval = setInterval(async () => {
      const jobs = await window.SahakarDB.getOpenJobs();
      callback(jobs);
    }, 2500);
    return () => clearInterval(interval);
  },
  
  getWorkerProfile: async (userId) => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('worker_profiles').select('*, societies(name)').eq('id', userId).single();
        if (!error && data) {
          return {...data, societyName: data.societies?.name || 'Jan Seva Society #12'};
        }
      } catch(e) {}
    }

    // Local profile check
    try {
      const saved = localStorage.getItem('sahakar_worker_profile');
      if (saved) return JSON.parse(saved);
    } catch(e) {}

    const p = MOCK_DATA.workerProfiles.find(p => p.id === userId);
    if(p) p.societyName = MOCK_DATA.societies.find(s=>s.id === p.societyId)?.name || 'Jan Seva Society #12';
    return p || {
      trade: 'Electrician',
      societyName: 'Jan Seva Society #12',
      societyId: 'SOC-2024-0012',
      lat: 28.5855,
      lng: 77.3100,
      approved: true
    };
  },
  
  submitWorkerProfile: async ({trade, societyId, itiCertUrl}) => {
    const user = await window.SahakarDB.getCurrentUser();
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data: { authUser } } = await supabaseClient.auth.getUser();
        const uid = authUser?.id || user?.id;
        if (uid) {
          await supabaseClient.from('worker_profiles').insert({
            id: uid,
            society_id: societyId,
            trade,
            iti_cert_url: itiCertUrl,
            approved: true,
            lat: 28.5855,
            lng: 77.3100
          });
        }
      } catch(e) {}
    }

    const p = {
      id: user?.id || 'w1',
      societyId,
      societyName: 'Jan Seva Society #12',
      trade,
      itiCertUrl,
      approved: true,
      lat: 28.5855,
      lng: 77.3100,
      joinedAt: new Date().toISOString(),
      totalJobs: 0,
      completedJobs: 0
    };
    localStorage.setItem('sahakar_worker_profile', JSON.stringify(p));
    return p;
  },
  
  getPendingWorkers: async () => [],
  approveWorker: async (userId) => {},
  
  getWelfareAccount: async (userId) => ({workerId: userId, pfBalance: 2340, poolBalance: 580}),
  getInsurancePolicies: async (userId) => [
    {scheme: 'PMSBY Accidental Insurance', policyNo: 'PMSBY-2026-8812', validTill: '2027-05-31'},
    {scheme: 'Cooperative Health Shield', policyNo: 'COOP-H-9921', validTill: '2026-12-31'}
  ],
  
  getTrustScore: async (userId) => {
    return {overall: 96.3, avgRating: 4.8, completionRate: 98, tenureYears: 1.2, ratingComponent: 57.6, completionComponent: 29.4, tenureComponent: 9.3};
  },
  
  submitRating: async (jobId, workerId, stars, tip = 0) => {
    const tipAmt = parseInt(tip, 10) || 0;
    const ratingObj = {
      jobId,
      workerId: workerId || 'w1',
      stars: parseInt(stars, 10) || 5,
      tip: tipAmt,
      createdAt: new Date().toISOString()
    };
    MOCK_DATA.ratings.push(ratingObj);

    // Update job status to completed & paid
    await window.SahakarDB.updateJobStatus(jobId, 'completed');

    // Create / update invoice with tip
    const inv = await window.SahakarDB.createInvoice(jobId, tipAmt);

    // Update worker welfare pool
    if (inv && inv.welfareContribution) {
      const wAccount = MOCK_DATA.welfareAccounts.find(w => w.workerId === workerId || w.workerId === 'w1');
      if (wAccount) {
        wAccount.poolBalance = (wAccount.poolBalance || 0) + inv.welfareContribution;
      }
    }

    if (!DEMO_MODE && supabaseClient) {
      try {
        await supabaseClient.from('ratings').insert({
          job_id: jobId,
          worker_id: workerId || 'w1',
          stars: parseInt(stars, 10) || 5,
          review: 'Cooperative service completed with fair wages'
        });
      } catch(e) {}
    }

    return true;
  },
  
  getWageFloors: async () => {
    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('wage_floors').select('*');
        if (!error && Array.isArray(data) && data.length > 0) return data;
      } catch(e) {}
    }
    return MOCK_DATA.wageFloors;
  },
  
  updateWageFloor: async (trade, amount) => {},
  
  getSettings: async () => {
    return MOCK_DATA.settings;
  },
  
  updateSettings: async (key, value) => {},
  getSosAlerts: async () => [],
  getGrievances: async () => [],
  submitGrievance: async (subject, body) => {},
  submitSos: async (lat, lng) => {},
  getSocieties: async () => {
    return MOCK_DATA.societies;
  },
  getDemandForecast: async (trade) => [],
  
  parseBooking: async (text) => {
    if (window.SahakarVoiceAssistant && window.SahakarVoiceAssistant.parse) {
      return window.SahakarVoiceAssistant.parse(text);
    }
    const t = text.toLowerCase();
    let service_type = 'Electrician';
    if(t.includes('plumb') || t.includes('tap') || t.includes('pipe')) service_type = 'Plumber';
    if(t.includes('ac')) service_type = 'AC Repair';
    if(t.includes('carpent') || t.includes('wood')) service_type = 'Carpenter';
    let budget = text.match(/\d+/) ? parseInt(text.match(/\d+/)[0], 10) : 450;
    return {service_type, location: 'Sector 62, Noida', budget, urgency: 'normal', description: text};
  },
  
  createInvoice: async (jobId, tip = 0) => {
    const tipAmt = parseInt(tip, 10) || 0;
    const job = await window.SahakarDB.getJob(jobId);
    let baseFare = job ? parseInt(job.offer, 10) : 400;

    // Check if there is an accepted bid for this job
    try {
      const bids = await window.SahakarDB.getBidsForJob(jobId);
      if (bids && bids.length > 0) {
        const accepted = bids.find(b => b.id === job?.acceptedBidId || b.id === job?.accepted_bid_id) || bids[0];
        if (accepted && accepted.amount) baseFare = parseInt(accepted.amount, 10);
      }
    } catch(e) {}

    const welfarePct = parseFloat(MOCK_DATA.settings.welfare_pct || '2') / 100;
    const welfareContribution = Math.round(baseFare * welfarePct);
    const platformFee = parseInt(MOCK_DATA.settings.platform_fee || '0', 10);
    const total = baseFare + welfareContribution + platformFee + tipAmt;
    const workerReceives = baseFare + tipAmt;

    const invoice = {
      id: 'inv_' + Date.now(),
      jobId: jobId,
      job_id: jobId,
      trade: job?.trade || 'Electrician',
      address: job?.address || 'Sector 62, Noida',
      description: job?.description || '',
      baseFare: baseFare,
      discount: 0,
      welfareContribution: welfareContribution,
      welfareAmount: welfareContribution,
      platformFee: platformFee,
      tip: tipAmt,
      total: total,
      workerReceives: workerReceives,
      createdAt: new Date().toISOString()
    };

    // Store in localStorage & MOCK_DATA
    try {
      const stored = JSON.parse(localStorage.getItem('sahakar_invoices') || '[]');
      const filtered = stored.filter(i => i.jobId !== jobId && i.job_id !== jobId);
      filtered.push(invoice);
      localStorage.setItem('sahakar_invoices', JSON.stringify(filtered));
    } catch(e) {}

    MOCK_DATA.invoices = MOCK_DATA.invoices.filter(i => i.jobId !== jobId && i.job_id !== jobId);
    MOCK_DATA.invoices.push(invoice);

    if (!DEMO_MODE && supabaseClient) {
      try {
        await supabaseClient.from('invoices').upsert({
          job_id: jobId,
          base_fare: baseFare,
          discount: 0,
          welfare_contribution: welfareContribution,
          platform_fee: platformFee,
          tip: tipAmt,
          total: total,
          worker_receives: workerReceives
        });
      } catch(e) {}
    }

    return invoice;
  },

  getInvoice: async (jobId) => {
    if (!jobId) return null;

    if (!DEMO_MODE && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('invoices').select('*').eq('job_id', jobId).single();
        if (!error && data) {
          return {
            id: data.id,
            jobId: data.job_id,
            job_id: data.job_id,
            baseFare: data.base_fare,
            discount: data.discount || 0,
            welfareContribution: data.welfare_contribution,
            welfareAmount: data.welfare_contribution,
            platformFee: data.platform_fee || 0,
            tip: data.tip || 0,
            total: data.total,
            workerReceives: data.worker_receives
          };
        }
      } catch(e) {}
    }

    try {
      const stored = JSON.parse(localStorage.getItem('sahakar_invoices') || '[]');
      const found = stored.find(i => i.jobId === jobId || i.job_id === jobId);
      if (found) return found;
    } catch(e) {}

    const mock = MOCK_DATA.invoices.find(i => i.jobId === jobId || i.job_id === jobId);
    if (mock) return mock;

    return await window.SahakarDB.createInvoice(jobId, 0);
  },

  getTradeIcon: async (trade) => {
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>';
  }
};
