import {React} from './shared';

type PortraitProps = {variant: 'hero' | 'profile'};

export function Portrait({variant}: PortraitProps){
  return <figure className={'op-portrait op-portrait-'+variant}>
    <img
      src={'/assets/ahmed-portraits-20261001/ahmed-'+variant+'.webp'}
      alt="Portrait of Ahmed Khalawy"
      width={960}
      height={1200}
      loading="eager"
      decoding="async"
      fetchPriority={variant==='hero' ? 'high' : 'auto'}
    />
    <figcaption>
      <strong>Ahmed Khalawy</strong>
      <span>{variant==='hero' ? 'Quality leadership & operational excellence' : 'Mechanical engineer · Riyadh, Saudi Arabia'}</span>
    </figcaption>
  </figure>;
}
