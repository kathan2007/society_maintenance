import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  Users, Wallet, AlertCircle, Bell, CheckCircle, 
  Clock, Shield, Zap, ArrowUpRight, LayoutDashboard,
  BarChart3, PieChart, Activity, MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StatsType {
  complaints: number;
  maintenance: number;
  pendingAmount: number;
  notices: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsType>({
    complaints: 0,
    maintenance: 0,
    pendingAmount: 0,
    notices: 0
  });
  
  const [financials, setFinancials] = useState({
    income: 0,
    expense: 0,
    catLabels: [] as string[],
    catValues: [] as number[]
  });

  const [publicComplaints, setPublicComplaints] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("name");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };

        const [complaints, maintenance, notices, expenses] = await Promise.all([
          axios.get(`${API_BASE_URL}/complaint`, { headers }),
          axios.get(`${API_BASE_URL}/maintenance`, { headers }),
          axios.get(`${API_BASE_URL}/notice`),
          axios.get(`${API_BASE_URL}/expense`, { headers })
        ]);

        // Basic Stats
        const pendingAmount = maintenance.data
          .filter((m: any) => m.status === 'Pending')
          .reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

        setStats({
          complaints: complaints.data.length || 0,
          maintenance: maintenance.data.length || 0,
          pendingAmount: pendingAmount,
          notices: notices.data.length || 0
        });

        // Financials for Charts
        const totalIncome = maintenance.data
          .filter((m: any) => m.status === 'Paid')
          .reduce((acc: number, m: any) => acc + (Number(m.amount) || 0), 0);
        
        const totalExpense = expenses.data.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);

        const catMap: {[key: string]: number} = {};
        expenses.data.forEach((e: any) => {
          catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
        });

        setFinancials({
          income: totalIncome,
          expense: totalExpense,
          catLabels: Object.keys(catMap),
          catValues: Object.values(catMap)
        });

        // Store latest 3 for the dashboard feed
        setPublicComplaints(complaints.data.slice(0, 3));

      } catch (err) {
        console.error("Dashboard Sync Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const barChartData = {
    labels: ['Society Treasury'],
    datasets: [
      {
        label: 'Maintenance Inflow',
        data: [financials.income],
        backgroundColor: '#2563eb',
        borderRadius: 8,
      },
      {
        label: 'Operational Outflow',
        data: [financials.expense],
        backgroundColor: '#f43f5e',
        borderRadius: 8,
      }
    ]
  };

  const pieChartData = {
    labels: financials.catLabels,
    datasets: [{
      data: financials.catValues,
      backgroundColor: ['#2563eb', '#6366f1', '#f59e0b', '#10b981', '#f43f5e'],
      borderWidth: 0
    }]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="page-container"
    >
      <div className="container-fluid px-md-4 py-4">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div>
            <div className="d-flex align-items-center gap-2 text-primary fw-900 text-uppercase small mb-2 letter-spacing-1">
              <Zap size={18} />
              Resident Identity Verified
            </div>
            <h1 className="fw-900 text-black mb-1 display-5">Welcome, {userName || 'Kathan'}</h1>
            <p className="text-secondary small mb-0 fw-800 uppercase letter-spacing-1">Live Transparency Portal • Shri Hari Gift City</p>
          </div>
          
          <div className="stats-badge-blue py-3 px-4 shadow-sm bg-white border border-2 border-primary border-opacity-10 rounded-4">
            <div className="d-flex align-items-center gap-3">
              <div className="pulse-indicator-green"></div>
              <div>
                <div className="extra-small text-muted fw-900 text-uppercase letter-spacing-1">SECURITY STATUS</div>
                <div className="small fw-900 text-primary uppercase">v2.5.0 STABLE SECURE</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- STAT CARDS --- */}
        <div className="row g-4 mb-5">
          <StatCard
            title="Active Complaints"
            value={stats.complaints}
            icon={<AlertCircle size={22} />}
            type="blue"
            delay={0.1}
          />
          <StatCard
            title="My Pending Dues"
            value={`₹${stats.pendingAmount}`}
            icon={<Wallet size={22} />}
            type="rose"
            delay={0.2}
          />
          <StatCard
            title="Society Bulletins"
            value={stats.notices}
            icon={<Bell size={22} />}
            type="amber"
            delay={0.3}
          />
          <StatCard
            title="Security Audit"
            value="A+"
            icon={<Shield size={22} />}
            type="green"
            delay={0.4}
          />
        </div>

        {/* --- FINANCIAL TRANSPARENCY CHARTS --- */}
        <div className="row g-4 mb-5">
           <div className="col-lg-8">
              <div className="luxury-card p-4 bg-white shadow-sm border-0 h-100">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-900 text-black text-uppercase letter-spacing-1 m-0 d-flex align-items-center gap-2">
                    <BarChart3 size={20} className="text-primary" />
                    Society Financial Transparency
                  </h5>
                  <span className="extra-small fw-900 text-muted uppercase">Audit Snapshot</span>
                </div>
                <div style={{height: '300px'}}>
                   <Bar 
                      data={barChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: true, labels: { font: { weight: 'bold' } } } }
                      }} 
                   />
                </div>
              </div>
           </div>
           <div className="col-lg-4">
              <div className="luxury-card p-4 bg-white shadow-sm border-0 h-100">
                <h5 className="fw-900 text-black text-uppercase letter-spacing-1 mb-4 d-flex align-items-center gap-2">
                  <PieChart size={20} className="text-primary" />
                  Expense Distribution
                </h5>
                <div style={{height: '300px'}} className="d-flex align-items-center justify-content-center">
                   {financials.catLabels.length > 0 ? (
                      <Pie 
                        data={pieChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } } }
                        }}
                      />
                   ) : (
                      <div className="text-center opacity-40">
                         <Activity size={40} className="mx-auto mb-2" />
                         <p className="extra-small fw-900 uppercase">Awaiting Data</p>
                      </div>
                   )}
                </div>
              </div>
           </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="luxury-card h-100 bg-white shadow-sm border-0 p-5">
              <div className="d-flex justify-content-between align-items-center mb-5">
                <h5 className="fw-900 text-black mb-0 d-flex align-items-center gap-3 uppercase letter-spacing-1 font-large">
                  <LayoutDashboard size={28} className="text-primary" />
                  Resident Controls
                </h5>
                <Link to="/maintenance" className="btn btn-outline-primary py-2 px-4 fw-900 text-uppercase extra-small letter-spacing-1 rounded-3">Fast Pay</Link>
              </div>
              
              <div className="row g-4">
                <ActionLink to="/maintenance" label="Payments" sub="Bills & Ledger" icon={<Wallet size={22}/>} color="indigo" />
                <ActionLink to="/complaint" label="Support" sub="Resolution Center" icon={<AlertCircle size={22}/>} color="rose" />
                <ActionLink to="/notice" label="Bulletin" sub="Announcements" icon={<Bell size={22}/>} color="amber" />
                <ActionLink to="/visitor" label="Visitor Desk" sub="Guest Entry" icon={<Users size={22}/>} color="emerald" />
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4 h-100">
               <div className="luxury-card p-4 bg-white shadow-sm border-0">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="fw-900 text-black text-uppercase letter-spacing-2 m-0 d-flex align-items-center gap-2">
                       <MessageSquare size={18} className="text-primary" />
                       Society Issues Feed
                    </h6>
                    <Link to="/complaint" className="extra-small fw-900 text-primary uppercase text-decoration-none">View All</Link>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {publicComplaints.length === 0 ? (
                      <p className="extra-small text-muted fw-800 uppercase text-center py-3">No active reports</p>
                    ) : (
                      publicComplaints.map((c: any) => (
                        <div key={c._id} className="p-3 bg-light rounded-3 border-start border-4" style={{borderColor: c.status === 'Resolved' ? '#10b981' : '#f59e0b'}}>
                          <div className="d-flex justify-content-between mb-1">
                             <div className="fw-900 text-black extra-small uppercase">{c.userId?.name || 'Member'} • {c.userId?.flatNo || 'N/A'}</div>
                             <div className={`fw-900 uppercase`} style={{fontSize: '0.6rem', color: c.status === 'Resolved' ? '#10b981' : '#f59e0b'}}>{c.status}</div>
                          </div>
                          <p className="extra-small text-secondary mb-0 text-truncate" style={{fontSize: '0.65rem'}}>{c.message}</p>
                        </div>
                      ))
                    )}
                  </div>
               </div>

               <div className="luxury-card flex-grow-1 p-4 bg-white shadow-sm border-0">
                 <h6 className="fw-900 text-black text-uppercase mb-4 letter-spacing-2">Security Monitoring</h6>
                 <div className="d-flex flex-column gap-3">
                   <MonitoringItem 
                     icon={<Shield size={18} />}
                     title="Firewall Verified"
                     desc="Encryption active"
                     status="Active"
                     color="blue"
                   />
                   <MonitoringItem 
                     icon={<Clock size={18} />}
                     title="Gate Control"
                     desc="Live feed active"
                     status="Live"
                     color="emerald"
                   />
                </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- SUB COMPONENTS ---

const StatCard = ({ title, value, icon, type, delay }: any) => {
  const colorMap = {
     blue: '#2563eb',
     rose: '#f43f5e',
     amber: '#f59e0b',
     green: '#10b981'
  };
  
  return (
  <div className="col-md-6 col-lg-3">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`bg-white p-4 h-100 position-relative shadow-sm rounded-4 border-bottom border-4`}
      style={{borderColor: (colorMap as any)[type] || '#000'}}
    >
      <div className={`mb-3 d-flex align-items-center justify-content-center rounded-3`} style={{width: '48px', height: '48px', background: `rgba(${(colorMap as any)[type]}, 0.1)`, color: (colorMap as any)[type] }}>
        {icon}
      </div>
      <h2 className="fw-900 mb-1 fs-3 text-black letter-spacing-1">{value}</h2>
      <p className="text-muted extra-small fw-900 text-uppercase letter-spacing-1 mb-0">{title}</p>
    </motion.div>
  </div>
  );
};

const ActionLink = ({ to, label, sub, icon, color }: any) => (
  <div className="col-md-6">
    <Link to={to} className="text-decoration-none">
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-light p-4 rounded-4 h-100 d-flex align-items-center border border-2 border-transparent transition-all"
        style={{borderStyle: 'solid'}}
      >
        <div className={`icon-circle-bg d-flex align-items-center justify-content-center rounded-3`} style={{width: '48px', height: '48px', background: '#ffffff', color: '#2563eb'}}>
          {icon}
        </div>
        <div className="ms-3">
          <div className="fw-900 text-black small mb-0 text-uppercase letter-spacing-1">{label}</div>
          <div className="extra-small text-muted fw-800 uppercase letter-spacing-1">{sub}</div>
        </div>
      </motion.div>
    </Link>
  </div>
);

const MonitoringItem = ({ icon, title, desc, status, color }: any) => (
  <div className="monitoring-item d-flex align-items-center justify-content-between p-3 bg-light rounded-4">
    <div className="d-flex align-items-center gap-3">
      <div className={`icon-box-sm d-flex align-items-center justify-content-center rounded-circle`} style={{width: '32px', height: '32px', background: '#ffffff', color: '#2563eb'}}>
        {icon}
      </div>
      <div>
        <div className="fw-900 text-black extra-small mb-0 text-uppercase letter-spacing-1">{title}</div>
        <div className="text-muted fw-800 uppercase" style={{fontSize: '0.6rem'}}>{desc}</div>
      </div>
    </div>
    <span className={`bg-${color === 'emerald' ? 'success' : 'primary'} text-white extra-small py-1 px-3 rounded-pill fw-900 uppercase`} style={{fontSize: '0.55rem'}}>{status}</span>
  </div>
);

export default Dashboard;