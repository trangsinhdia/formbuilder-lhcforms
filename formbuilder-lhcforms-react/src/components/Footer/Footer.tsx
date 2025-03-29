import React from 'react';

interface FooterProps {
  version?: string;
}

export const Footer: React.FC<FooterProps> = ({ version = '1.0.0' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer mt-auto py-3 bg-light">
      <div className="container">
        <div className="row">
          <div className="col text-center">
            <span className="text-muted">
              © {currentYear} LHC Forms Builder v{version}
            </span>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col text-center">
            <small className="text-muted">
              Powered by{' '}
              <a 
                href="https://lhncbc.nlm.nih.gov/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-decoration-none"
              >
                Lister Hill National Center for Biomedical Communications
              </a>
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;