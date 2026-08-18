import MobileForm from '../../components/MobileForm';

const fields = [
  { name: 'state', label: 'State', required: true, placeholder: 'e.g. Gujarat, Rajasthan' },
  { name: 'hq', label: 'HQ City', required: true, placeholder: 'Headquarter city' },
  { name: 'fromCity', label: 'From City', required: true, placeholder: 'Starting city' },
  { name: 'toCity', label: 'To City', required: true, placeholder: 'Destination city' },
  {
    name: 'areaType',
    label: 'Area Type',
    options: ['Local', 'Ex-Station', 'Out-Station'],
  },
  { name: 'distance', label: 'Distance (KM)', type: 'number', placeholder: 'Distance in KM' },
];

export default function RouteForm() {
  return (
    <MobileForm
      title="Add Route"
      subtitle="Define a travel route & distance"
      endpoint="route"
      fields={fields}
      accentColor="violet"
    />
  );
}
