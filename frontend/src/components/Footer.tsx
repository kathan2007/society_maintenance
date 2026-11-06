import React from "react";
import { MapPin, Phone, Mail, Building2, Facebook, Twitter, Instagram } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-top border-5 border-black mt-5 pt-5 pb-4">
      <div className="container-fluid px-md-5">
        <div className="row g-5 mb-5">
          {/* Company Info */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-black p-2 rounded-2 text-white">
                <Building2 size={24} />
              </div>
              <h4 className="fw-900 m-0 text-black letter-spacing-1">SHREE HARI GIFT CITY</h4>
            </div>
            <p className="text-black fw-900 extra-small text-uppercase letter-spacing-1 mb-4">
              A premium management system for modern society living. Ensuring security, transparency, and architectural harmony.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="bg-black text-white p-2 rounded-circle hover-scale"><Facebook size={18} /></a>
              <a href="#" className="bg-black text-white p-2 rounded-circle hover-scale"><Twitter size={18} /></a>
              <a href="#" className="bg-black text-white p-2 rounded-circle hover-scale"><Instagram size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6 ps-lg-5">
            <h6 className="fw-900 text-black text-uppercase mb-4 letter-spacing-1">Registry</h6>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li><a href="#" className="text-decoration-none text-black extra-small fw-900 uppercase">Dashboard</a></li>
              <li><a href="#" className="text-decoration-none text-black extra-small fw-900 uppercase">Payments</a></li>
              <li><a href="#" className="text-decoration-none text-black extra-small fw-900 uppercase">Notice Board</a></li>
              <li><a href="#" className="text-decoration-none text-black extra-small fw-900 uppercase">Complaints</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="col-lg-2 col-md-6">
            <h6 className="fw-900 text-black text-uppercase mb-4 letter-spacing-1">Comms</h6>
            <ul className="list-unstyled d-flex flex-column gap-3">
              <li className="d-flex align-items-center gap-2">
                <Phone size={16} className="text-primary" style={{color: '#2563eb'}} />
                <span className="text-black extra-small fw-900">+91 98765 43210</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <Mail size={16} className="text-primary" style={{color: '#2563eb'}} />
                <span className="text-black extra-small fw-900">management@shreeharigiftcity.com</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <MapPin size={16} className="text-primary" style={{color: '#2563eb'}} />
                <span className="text-black extra-small fw-900">Ahmedabad, Gujarat, IN</span>
              </li>
            </ul>
          </div>

          {/* Society Map Section */}
          <div className="col-lg-4 col-md-6">
            <h6 className="fw-900 text-black text-uppercase mb-4 letter-spacing-1">Society Map Overview</h6>
            <div className="rounded-3 overflow-hidden border border-4 border-black shadow-sm" style={{ height: '200px' }}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.304033100366!2d72.6834885750926!3d23.049326879155025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e81d4a3c2588b%3A0x202882c784f2f2f2!2sShri%20Hari%20Gift%20City!5e0!3m2!1sen!2sin!4v1710715000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Map"
              ></iframe>
            </div>
            <div className="mt-2 text-end">
              <span className="extra-small fw-900 text-black uppercase opacity-75">Secure Gate Control Active</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-top border-black d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <p className="m-0 text-black extra-small fw-900 uppercase opacity-75">&copy; 2026 SHREE HARI GIFT CITY MANAGEMENT PROTOCOL . ALL RIGHTS RESERVED.</p>
          <div className="d-flex gap-4">
            <a href="#" className="text-decoration-none text-black extra-small fw-900 uppercase">Privacy</a>
            <a href="#" className="text-decoration-none text-black extra-small fw-900 uppercase">Security</a>
            <a href="#" className="text-decoration-none text-black extra-small fw-900 uppercase">Compliance</a>
          </div>
        </div>
      </div>
      <style>{`
        .hover-scale { transition: transform 0.2s; cursor: pointer; }
        .hover-scale:hover { transform: scale(1.1); }
      `}</style>
    </footer>
  );
};

export default Footer;
