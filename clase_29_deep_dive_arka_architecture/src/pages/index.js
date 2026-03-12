import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const FeatureList = [
  {
    title: '🧱 HUs Arquitectonicas',
    description: 'Recorre HU1 a HU8 con decisiones de dominio, integracion y resiliencia.',
  },
  {
    title: '🧭 Diagramas Mermaid Interactivos',
    description: 'Visualiza flujos complejos con zoom, pan, reset y modo fullscreen.',
  },
  {
    title: '🗂️ Fuente Draw.io',
    description: 'Descarga y edita el archivo base de arquitectura para evolucionar el diseno.',
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="card" style={{margin: '0.5rem', height: '100%'}}>
        <div className="card__body text--center">
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/intro">
            📘 Abrir Documentacion
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Deep Dive ARKA Architecture"
      description="Documentacion tecnica de arquitectura para el ecosistema ARKA B2B">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
