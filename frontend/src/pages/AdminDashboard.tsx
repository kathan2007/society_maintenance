import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, AlertCircle, Clock, Bell, Wallet, 
  TrendingUp, ShieldCheck, ArrowUpRight,
  Activity, BarChart3, PieChart, Settings
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    complaints: 0,
    pending: 0,
    notices: 0,
    pendingMaintenance: 0,
    collectedMaintenance: 0,
    totalExpenses: 0
  });

  const [categoryData, setCategoryData] = useState<{labels: string[], values: number[]}>({labels: [], values: []});
  const [timelineData, setTimelineData] = useState<{labels: string[], income: number[], expense: number[]}>({labels: [], income: [], expense: []});
  const [settings, setSettings] = useState({ ownerMaintenanceAmount: 0, rentMaintenanceAmount: 0, penaltyAmount: 0 });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const token = localStorage.getItem("token");
  const adminName = localStorage.getItem("name") || "Administrator";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [users, complaints, notices, maintenance, expenses, settingsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/users`, { headers }),
          axios.get(`${API_BASE_URL}/complaint`, { headers }),
          axios.get(`${API_BASE_URL}/notice`),
          axios.get(`${API_BASE_URL}/maintenance`, { headers }),
          axios.get(`${API_BASE_URL}/expense`, { headers }),
          axios.get(`${API_BASE_URL}/settings`, { headers })
        ]);

        const pending = complaints.data.filter((c: any) => c.status === "Pending").length;
        const pendingMaint = maintenance.data.filter((m: any) => m.status === "Pending").length;
        const collectedMaint = maintenance.data
          .filter((m: any) => m.status === "Paid")
          .reduce((acc: number, m: any) => acc + (Number(m.totalAmount || m.amount) || 0), 0);
        
        const totalExp = expenses.data.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);

        // Group expenses by category for Pie Chart
        const catMap: {[key: string]: number} = {};
        expenses.data.forEach((e: any) => {
          catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
        });

        setStats({
          users: users.data.length,
          complaints: complaints.data.length,
          pending: pending,
          notices: notices.data.length,
          pendingMaintenance: pendingMaint,
          collectedMaintenance: collectedMaint,
          totalExpenses: totalExp
        });

        setCategoryData({
          labels: Object.keys(catMap),
          values: Object.values(catMap)
        });

        if (settingsRes.data) {
          setSettings({
            ownerMaintenanceAmount: settingsRes.data.ownerMaintenanceAmount,
            rentMaintenanceAmount: settingsRes.data.rentMaintenanceAmount,
            penaltyAmount: settingsRes.data.penaltyAmount || 0
          });
        }

        // Generate 6 Month Timeline
        const months = [];
        const incomeTrend = [];
        const expenseTrend = [];
        
        for(let i=5; i>=0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const mFull = d.toLocaleString('default', { month: 'short' });
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            
            months.push(mFull);
            
            const mInc = maintenance.data
                .filter((m: any) => m.status === "Paid" && m.month === mKey)
                .reduce((s: number, m: any) => s + (m.totalAmount || m.amount), 0);
            
            const mExp = expenses.data
                .filter((e: any) => e.date.startsWith(mKey))
                .reduce((s: number, e: any) => s + e.amount, 0);
            
            incomeTrend.push(mInc);
            expenseTrend.push(mExp);
        }

        setTimelineData({ labels: months, income: incomeTrend, expense: expenseTrend });

      } catch (err) {
        console.log("Admin Sync Error", err);
      }
    };
    fetchData();
  }, [token]);

  const handleUpdateSettings = async () => {
    try {
      setUpdatingSettings(true);
      await axios.put(`${API_BASE_URL}/settings`, settings, { headers: { Authorization: `Bearer ${token}` } });
      alert("Maintenance Settings Updated Successfully!");
    } catch (err) {
      alert("Error updating settings.");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const barChartData = {
    labels: ['Financial Overview'],
    datasets: [
      {
        label: 'Income (Maintenance)',
        data: [stats.collectedMaintenance],
        backgroundColor: '#10b981',
        borderRadius: 8,
      },
      {
        label: 'Expenses',
        data: [stats.totalExpenses],
        backgroundColor: '#f43f5e',
        borderRadius: 8,
      }
    ]
  };

  const pieChartData = {
    labels: categoryData.labels,
    datasets: [{
      data: categoryData.values,
      backgroundColor: ['#2563eb', '#6366f1', '#f59e0b', '#10b981', '#f43f5e'],
      borderWidth: 0
    }]
  };

  const lineChartData = {
    labels: timelineData.labels,
    datasets: [
      {
        label: 'Revenue Trend',
        data: timelineData.income,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Expense Trend',
        data: timelineData.expense,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="page-container"
    >
      <div className="container-fluid px-md-4 py-4">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div>
            <div className="d-flex align-items-center gap-2 text-primary fw-900 text-uppercase small mb-2 letter-spacing-1">
              <ShieldCheck size={18} />
              Command Center Authority
            </div>
            <h1 className="fw-900 text-black mb-1 display-5">Admin Overview, {adminName}</h1>
            <div className="d-flex align-items-center gap-2">
              <div className="pulse-indicator-green"></div>
              <span className="text-secondary extra-small fw-900 text-uppercase letter-spacing-2">Live Insights • Financial Control Mode Active</span>
            </div>
          </div>
          
          <div className="bg-primary text-white py-3 px-4 shadow-lg rounded-4 d-none d-md-block" style={{background: '#2563eb'}}>
              <p className="fw-900 mb-0 small text-uppercase letter-spacing-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="extra-small fw-900 mb-0 text-uppercase letter-spacing-1 mt-1 opacity-75">Control v2.5.0</p>
          </div>
        </div>

        {/* --- STAT CARDS GRID --- */}
        <div className="row g-4 mb-5">
          <StatCard 
            variants={itemVariants}
            onClick={() => navigate("/admin-users")}
            icon={<Users size={24} />}
            value={stats.users}
            label="Residents"
            type="blue"
          />
          <StatCard 
            variants={itemVariants}
            onClick={() => navigate("/admin-complaints")}
            icon={<AlertCircle size={24} />}
            value={stats.complaints}
            label="Reports"
            type="indigo"
          />
          <StatCard 
            variants={itemVariants}
            onClick={() => navigate("/maintenance")}
            icon={<Wallet size={24} />}
            value={`₹${stats.collectedMaintenance.toLocaleString()}`}
            label="Total Income"
            type="green"
          />
          <StatCard 
            variants={itemVariants}
            onClick={() => navigate("/expenses")}
            icon={<TrendingUp size={24} />}
            value={`₹${stats.totalExpenses.toLocaleString()}`}
            label="Total Expense"
            type="rose"
          />
          <StatCard 
            variants={itemVariants}
            onClick={() => navigate("/expenses")}
            icon={<Activity size={24} />}
            value={`₹${(stats.collectedMaintenance - stats.totalExpenses).toLocaleString()}`}
            label="Net Balance"
            type="amber"
          />
        </div>

        {/* --- MAINTENANCE SETTINGS CALIBRATION --- */}
        <div className="row mb-5">
           <div className="col-lg-12">
              <div className="bg-white p-4 rounded-4 shadow-sm">
                 <h5 className="fw-900 text-black text-uppercase letter-spacing-1 mb-4 d-flex align-items-center gap-2">
                    <Settings size={20} className="text-primary" />
                    Base Maintenance Calibration
                 </h5>
                  <div className="row g-4 align-items-end">
                    <div className="col-md-3">
                       <label className="extra-small fw-900 text-uppercase mb-2 text-muted letter-spacing-1">Owner Monthly (₹)</label>
                       <input 
                          type="number" 
                          className="form-control py-3 ps-4 fw-800 text-black border-2" 
                          style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc'}}
                          value={settings.ownerMaintenanceAmount}
                          onChange={(e) => setSettings({...settings, ownerMaintenanceAmount: Number(e.target.value)})}
                       />
                    </div>
                    <div className="col-md-3">
                       <label className="extra-small fw-900 text-uppercase mb-2 text-muted letter-spacing-1">Rent/Tenant (₹)</label>
                       <input 
                          type="number" 
                          className="form-control py-3 ps-4 fw-800 text-black border-2" 
                          style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc'}}
                          value={settings.rentMaintenanceAmount}
                          onChange={(e) => setSettings({...settings, rentMaintenanceAmount: Number(e.target.value)})}
                       />
                    </div>
                    <div className="col-md-3">
                       <label className="extra-small fw-900 text-uppercase mb-2 text-muted letter-spacing-1">Penalty After 15th (₹)</label>
                       <input 
                          type="number" 
                          className="form-control py-3 ps-4 fw-800 text-black border-2" 
                          style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc'}}
                          value={settings.penaltyAmount}
                          onChange={(e) => setSettings({...settings, penaltyAmount: Number(e.target.value)})}
                       />
                    </div>
                    <div className="col-md-3">
                       <button 
                          className="btn w-100 py-3 fw-900 text-uppercase letter-spacing-1 text-white shadow-sm"
                          style={{background: '#2563eb', borderRadius: '12px'}}
                          onClick={handleUpdateSettings}
                          disabled={updatingSettings}
                       >
                          {updatingSettings ? "Syncing..." : "Update Amount"}
                       </button>
                    </div>
                  </div>
              </div>
           </div>
        </div>

        <div className="row g-4 mb-5">
           {/* --- BUDGET TREND LINE CHART --- */}
           <div className="col-lg-12">
              <motion.div variants={itemVariants} className="luxury-card p-4 bg-white" style={{minHeight: '400px'}}>
                 <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-900 text-black text-uppercase letter-spacing-1 m-0 d-flex align-items-center gap-2">
                       <Activity size={20} className="text-primary" />
                       6-Month Budget Performance Trend
                    </h5>
                    <div className="d-flex gap-2">
                        <div className="extra-small fw-900 text-primary border px-2 py-1 rounded">INCOME</div>
                        <div className="extra-small fw-900 text-danger border px-2 py-1 rounded">EXPENSE</div>
                    </div>
                 </div>
                 <div style={{height: '350px'}}>
                    <Line 
                      data={lineChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { 
                          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { weight: 'bold' } } },
                          x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
                        }
                      }}
                    />
                 </div>
              </motion.div>
           </div>
        </div>

        <div className="row g-4 mb-5">
           {/* --- INCOME VS EXPENSE BAR CHART --- */}
           <div className="col-lg-7">
              <motion.div variants={itemVariants} className="luxury-card p-4 h-100 bg-white">
                 <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-900 text-black text-uppercase letter-spacing-1 m-0 d-flex align-items-center gap-2">
                       <BarChart3 size={20} className="text-primary" />
                       Cumulative Financial Profile
                    </h5>
                 </div>
                 <div style={{height: '300px'}}>
                    <Bar 
                      data={barChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: true, position: 'bottom' } },
                        scales: { y: { ticks: { font: { weight: 'bold' } } }, x: { ticks: { font: { weight: 'bold' } } } }
                      }} 
                    />
                 </div>
              </motion.div>
           </div>

           {/* --- EXPENSE DISTRIBUTION PIE CHART --- */}
           <div className="col-lg-5">
              <motion.div variants={itemVariants} className="luxury-card p-4 h-100 bg-white">
                 <h5 className="fw-900 text-black text-uppercase letter-spacing-1 mb-4 d-flex align-items-center gap-2">
                    <PieChart size={20} className="text-primary" />
                    Expenditure Topology
                 </h5>
                 <div style={{height: '300px'}} className="d-flex align-items-center justify-content-center">
                    {categoryData.labels.length > 0 ? (
                      <Pie 
                        data={pieChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'right', labels: { font: { weight: 'bold', size: 10 }, boxWidth: 15 } } }
                        }}
                      />
                    ) : (
                      <div className="text-center opacity-40">
                         <Activity size={40} className="mx-auto mb-2" />
                         <p className="extra-small fw-900 uppercase">Awaiting Ledger Entry</p>
                      </div>
                    )}
                 </div>
              </motion.div>
           </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-12">
             <div className="luxury-card p-4 bg-white shadow-sm border-0 d-flex justify-content-between align-items-center">
                <div>
                   <h6 className="fw-900 text-black text-uppercase mb-1 letter-spacing-2">Financial Health Check</h6>
                   <p className="text-muted extra-small fw-800 uppercase mb-0">System analyzing total maintenance inflow against society outflow.</p>
                </div>
                <button 
                  onClick={() => navigate("/expenses")}
                  className="btn btn-primary py-3 px-5 fw-900 text-uppercase letter-spacing-2 rounded-4 shadow-none border-0"
                  style={{background: '#2563eb'}}
                >
                  Manage Ledger
                </button>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ variants, onClick, icon, value, label, type, isUrgent }: any) => {
  const colorMap = {
     blue: '#2563eb',
     indigo: '#6366f1',
     rose: '#f43f5e',
     amber: '#f59e0b',
     green: '#10b981'
  };
  
  return (
  <div className="col-sm-6 col-lg">
    <motion.div
      variants={variants}
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={onClick}
      className={`bg-white p-4 h-100 position-relative cursor-pointer shadow-sm rounded-4 border-bottom border-4`}
      style={{borderColor: (colorMap as any)[type] || '#000' }}
    >
      <div className={`mb-4 d-flex align-items-center justify-content-center rounded-4`} style={{width: '56px', height: '56px', background: `rgba(${(colorMap as any)[type]}, 0.1)`, color: (colorMap as any)[type] }}>
        {icon}
      </div>
      <h2 className="fw-900 mb-1 fs-3 text-black letter-spacing-1">{value}</h2>
      <p className="text-muted extra-small fw-900 text-uppercase letter-spacing-1 mb-0">{label}</p>
      
      {isUrgent && (
        <div className="mt-3 bg-danger bg-opacity-10 text-danger px-2 py-1 extra-small fw-900 text-uppercase letter-spacing-1 d-inline-block rounded-2">
          Critical Status
        </div>
      )}
    </motion.div>
  </div>
  );
};

export default AdminDashboard;