import React from "react";
import { Link } from "react-router-dom";
import { Building2, Phone, Mail, MapPin, Shield, CheckCircle } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        color: "var(--text-secondary)",
        paddingTop: "var(--space-10)",
        paddingBottom: "var(--space-8)",
        marginTop: "auto",
        transition: "background-color var(--transition-base), border-color var(--transition-base)",
      }}
    >
      <div className="container-limit">
        <div className="row g-4 mb-5">
          {/* Col 1: Brand & Purpose */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--accent)",
                  color: "var(--on-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={18} />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Shree Hari Gift City
              </span>
            </div>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--text-secondary)" }}>
              A modern, transparent residential portal built for streamlined maintenance, billing
              visibility, visitor approvals, and community governance.
            </p>
            <div className="d-flex align-items-center gap-2 text-success mt-3" style={{ fontSize: "var(--text-xs)", color: "var(--success)" }}>
              <CheckCircle size={16} />
              <span>Verified Residential Society Management System</span>
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--text-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "var(--space-4)",
              }}
            >
              Registry
            </h6>
            <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: "var(--text-sm)" }}>
              <li>
                <Link to="/dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Resident Home
                </Link>
              </li>
              <li>
                <Link to="/maintenance" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Maintenance Bills
                </Link>
              </li>
              <li>
                <Link to="/notice" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Society Bulletins
                </Link>
              </li>
              <li>
                <Link to="/complaint" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Issue Redressal
                </Link>
              </li>
              <li>
                <Link to="/visitor" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Visitor Log
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Details */}
          <div className="col-lg-3 col-md-6 col-6">
            <h6
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--text-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "var(--space-4)",
              }}
            >
              Office Contacts
            </h6>
            <ul className="list-unstyled d-flex flex-column gap-3" style={{ fontSize: "var(--text-sm)" }}>
              <li className="d-flex align-items-start gap-2">
                <MapPin size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  GIFT City Road, Gandhinagar, Gujarat 382355
                </span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <Phone size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <a href="tel:+919876543210" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  +91 98765 43210
                </a>
              </li>
              <li className="d-flex align-items-center gap-2">
                <Mail size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <a href="mailto:office@shreeharigiftcity.com" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  office@shreeharigiftcity.com
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Location Map */}
          <div className="col-lg-3 col-md-6">
            <h6
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--text-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "var(--space-4)",
              }}
            >
              Location & Campus
            </h6>
            <div
              style={{
                height: "140px",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              <iframe
                title="Shree Hari Gift City Map Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.304033100366!2d72.6834885750926!3d23.049326879155025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e81d4a3c2588b%3A0x202882c784f2f2f2!2sShri%20Hari%20Gift%20City!5e0!3m2!1sen!2sin!4v1710715000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "6px", marginBottom: 0 }}>
              Physical campus entry via Security Gate A.
            </p>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "var(--space-6)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} Shree Hari Gift City Portal. All rights reserved.
          </div>
          <div className="d-flex align-items-center gap-3">
            <span>Security Protected</span>
            <span>•</span>
            <span>Privacy Compliant (DPDP Act)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
