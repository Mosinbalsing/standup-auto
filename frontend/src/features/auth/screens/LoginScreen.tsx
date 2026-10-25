import { Github } from '@/components/ui/GithubIcon';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, SlidersHorizontal, FileCheck2, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '@/components/Header/PublicHeader';
import { ProductAnimation } from '../components/ProductAnimation';
import { useSession } from '../hooks/useSession';
export function LoginScreen() {
  const session = useSession(),
    [params] = useSearchParams();
  return (
    <>
      <PublicHeader login />
      <main id="main" className="login-main login-reference">
        <section className="login-intro">
          <h1>
            Less remembering.
            <br />
            <span className="accent">More building.</span>
          </h1>
          <p>Your GitHub activity, shaped into a standup you can trust.</p>
          <ProductAnimation login />
        </section>
        <section className="panel login-card">
          <h2>Welcome back.</h2>
          <p>Your next standup starts here.</p>
          {params.get('error') && (
            <p role="alert" className="workspace-error">
              Sign-in was not completed. Please try again.
            </p>
          )}
          <a className="btn white" href="/api/auth/github">
            <Github size={22} />
            Continue with GitHub
          </a>
          {session.data && !session.data.githubConfigured && (
            <p className="tiny muted">
              GitHub sign-in needs server configuration. You can explore the demo below.
            </p>
          )}
          <div className="or">or explore first</div>
          <Link className="btn ghost" to="/demo">
            <Play size={19} />
            Try demo without signing in
          </Link>
          <div className="promise">
            {[
              {
                Icon: SlidersHorizontal,
                title: 'Choose your repositories',
                description: 'Connect only what you want.',
              },
              {
                Icon: FileCheck2,
                title: 'Review before sharing',
                description: 'You’re always in control.',
              },
              {
                Icon: ShieldCheck,
                title: 'Disconnect at any time',
                description: 'Remove stored access in a click.',
              },
            ].map(({ Icon, title, description }) => (
              <div className="row" key={title}>
                <span className="promise-icon">
                  <Icon size={21} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="tiny mt-6">
            Only selected repository metadata is collected. Nothing is auto-sent.
          </p>
        </section>
      </main>
    </>
  );
}
