import {
  formatLeadInterestSummary,
  getLeadInterestItems,
  getLeadStage,
  getLeadStatusLabel,
} from './lead-display'

describe('lead display helpers', () => {
  it('shows a single property interest', () => {
    expect(getLeadInterestItems({ property_name: 'Aslam Resort' })).toEqual(['Aslam Resort'])
  })

  it('shows multiple property interests from strings and objects', () => {
    expect(getLeadInterestItems({
      interested_properties: [
        'Aslam Resort',
        { property_name: 'Lake View Villa' },
        { name: 'Hill Camp' },
      ],
    })).toEqual(['Aslam Resort', 'Lake View Villa', 'Hill Camp'])
  })

  it('dedupes repeated property names across fields', () => {
    expect(getLeadInterestItems({
      property_name: 'Aslam Resort',
      properties: [{ name: 'Aslam Resort' }, { name: 'River Cottage' }],
    })).toEqual(['Aslam Resort', 'River Cottage'])
  })

  it('summarizes multiple properties for compact cards', () => {
    expect(formatLeadInterestSummary(['Aslam Resort', 'Lake View Villa', 'Hill Camp'])).toBe('Aslam Resort, Lake View Villa +1 more')
  })

  it('routes enquiry stages for launch cases', () => {
    expect(getLeadStage({ status: 'new' })).toBe('new')
    expect(getLeadStage({ status: 'interested' })).toBe('conversation')
    expect(getLeadStage({ status: 'booked' })).toBe('booked')
    expect(getLeadStage({ status: 'converted' })).toBe('booked')
    expect(getLeadStage({ status: 'settled' })).toBe('lost')
    expect(getLeadStage({ followup_at: '2026-06-02T10:00:00Z' })).toBe('followup')
  })

  it('uses ordinary-language labels', () => {
    expect(getLeadStatusLabel({ status: 'interested' })).toBe('Talking')
    expect(getLeadStatusLabel({ status: 'settled' })).toBe('Closed')
    expect(getLeadStatusLabel({ status: 'won' })).toBe('Booked')
  })
})
