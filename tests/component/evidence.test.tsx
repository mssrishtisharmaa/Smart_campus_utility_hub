// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach} from 'vitest';
import '@testing-library/jest-dom/vitest';
import {EvidenceCard,Badge,ErrorState} from '@/components/ui';
afterEach(cleanup);
describe('Evidence and accessible states',()=>{
 it('shows source, valid times and explicit demo status',()=>{render(<EvidenceCard evidence={{location:'New Delhi',source:'Demo weather',sourceUrl:'/data-sources',retrievedAt:'2025-01-01T00:00:00Z',issuedAt:null,validFrom:'2025-01-01T00:00:00Z',validTo:'2025-01-02T00:00:00Z',state:'demo',confidence:'Low',reasons:['Synthetic data'],ruleVersion:'test',hash:'abc'}}/>);expect(screen.getByText('demo')).toBeInTheDocument();expect(screen.getByText('New Delhi')).toBeInTheDocument();expect(screen.getByText('Not supplied by provider')).toBeInTheDocument();});
 it('severity is expressed in text, not only color',()=>{render(<Badge tone="red">Warning</Badge>);expect(screen.getByText('Warning')).toBeInTheDocument();});
 it('provides a retry action on error',()=>{render(<ErrorState message="Provider unavailable" retry={()=>{}}/>);expect(screen.getByRole('alert')).toHaveTextContent('Provider unavailable');expect(screen.getByRole('button',{name:'Try again'})).toBeInTheDocument();});
});
