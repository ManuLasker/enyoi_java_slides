import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const FeatureList = [
  {
    title: '⚡ Spring WebFlux',
    description: 'Construye APIs reactivas y no bloqueantes con Mono y Flux para manejar alta concurrencia.',
  },
  {
    title: '📨 Apache Kafka',
    description: 'Implementa mensajería basada en eventos con productores y consumidores reactivos.',
  },
  {
    title: '🏛️ Clean Architecture',
    description: 'Estructura tu código con Arquitectura Hexagonal y DDD siguiendo el scaffold de Bancolombia.',
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
            🚀 Comenzar el Lab
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
      title="Lab Arka: Microservicios Reactivos"
      description="Workshop práctico de Spring WebFlux, Kafka, Clean Architecture y LocalStack">
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
