import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Resources',
      links: [
        // { name: 'Documentation', href: '/docs' },
        // { name: 'API Reference', href: '/api' },
        { name: 'Status', href: '/status' },
      ],
    },
    {
      title: 'Support',
      links: [
        // { name: 'Help Center', href: '/help' },
        { name: 'Contact', href: '/contact' },
      ],
    },
  ];

  return (
    <footer 
      className="relative z-10 mt-auto"
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 4, 40, 0.6)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Logo and Copyright */}
          <div className="flex flex-col gap-4">
            {/* <Link to="/" className="hover:opacity-80 transition-opacity">
              <img 
                src={logo} 
                alt="Oasys Innovation Lab" 
                className="h-6 w-auto opacity-80"
              />
            </Link> */}
            <p className="text-sm text-white/40">
              © {currentYear} Oasys Innovation Lab. All rights reserved.
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex gap-12">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-white/80 mb-3">
                  {section.title}
                </h4>
                <ul className="flex flex-col gap-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm text-white/40 hover:text-white/80 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Version Badge */}
          <div className="flex items-center gap-2">
            <span 
              className="text-xs px-3 py-1 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              Pipeline Portal v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
