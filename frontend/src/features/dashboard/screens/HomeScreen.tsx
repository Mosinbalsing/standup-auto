import { Github } from '@/components/ui/GithubIcon';
import { Link } from 'react-router-dom';
import { Play, LockKeyhole, ShieldCheck, ArrowRight } from 'lucide-react';
import { PublicHeader } from '@/components/Header/PublicHeader';
import { Brand } from '@/components/Header/Brand';
import { ProductAnimation } from '@/features/auth/components/ProductAnimation';
export function HomeScreen() {
  return (
    <>
      <PublicHeader />
      <main id="main">
        <section className="land-section hero-new">
          <span className="badge green">
            <span className="dot" />
            Less admin. More building.
          </span>
          <h1 className="land-title mt-6">
            Your work becomes
            <br />
            your <span className="accent">standup.</span>
          </h1>
          <p className="land-lead">
            Turn GitHub activity into a clear daily update.
            <br />
            Review, edit, and share on your terms.
          </p>
          <div className="hero-actions">
            <Link className="btn white" to="/login">
              <Github size={20} />
              Continue with GitHub
            </Link>
            <Link className="btn ghost" to="/demo">
              <Play size={18} />
              Explore the demo
            </Link>
          </div>
          <div className="trust">
            <LockKeyhole size={15} />
            You choose the repositories. Nothing is auto-sent.
          </div>
          <ProductAnimation />
        </section>
        <section className="process" id="how-it-works" aria-label="How it works">
          {[
            ['01', 'Connect your GitHub', 'Choose the repositories that belong in your update.'],
            ['02', 'Make the draft yours', 'Keep the evidence. Add the context only you know.'],
            ['03', 'Copy. Share. Get building.', 'A clear update, in the format your team uses.'],
          ].map(([number, title, description]) => (
            <div key={number}>
              <span className="number">{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </section>
        <section className="home-preview">
          <span className="eyebrow">From activity to clarity</span>
          <h2 className="mt-4">The update is yours to tell.</h2>
          <p>Source-linked work. Your plans. The final word stays with you.</p>
          <div className="preview-window">
            <div className="window-bar">
              <i />
              <i />
              <i />
              <span className="tiny muted ml-auto">Standup Auto · Product preview</span>
            </div>
            <div className="preview-content">
              <div>
                <h3>Activity, without the archaeology.</h3>
                {[
                  'Merged login validation improvements',
                  'Reviewed password reset flow',
                  'Committed API pagination updates',
                ].map((text, i) => (
                  <div className="react-preview-event" key={text}>
                    <span className="badge">{['Pull request', 'Review', 'Commit'][i]}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3>Your daily update</h3>
                <span className="eyebrow accent">Yesterday</span>
                <p className="mt-3">Merged login validation improvements.</p>
                <span className="eyebrow accent">Today</span>
                <p className="mt-3">Add password reset tests.</p>
                <Link className="btn primary mt-5" to="/demo">
                  Explore the working demo <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="privacy-section" id="privacy">
          <ShieldCheck size={28} />
          <div>
            <h2>Built around your boundaries.</h2>
            <p>
              Collect activity from repositories you select. Keep code and diffs out of storage.
              Review every update before copying it. Disconnect and delete your data when you
              choose.
            </p>
            <p className="mt-3">
              The demo uses a separate sample account with data saved on this server.
            </p>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <Brand />
        <span>A calmer start to your standup.</span>
        <Link className="text-link" to="/demo">
          Try the demo <ArrowRight size={15} />
        </Link>
      </footer>
    </>
  );
}
