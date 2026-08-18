import MobileForm from '../../components/MobileForm';

const fields = [
  { name: 'state', label: 'State', required: true, placeholder: 'e.g. Gujarat, Rajasthan' },
  { name: 'hq', label: 'HQ City', required: true, placeholder: 'Headquarter city name' },
  { name: 'cityName', label: 'City Name', required: true, placeholder: 'City to register' },
];

export default function CityForm() {
  return (
    <MobileForm
      title="Add City"
      subtitle="Register a new city or area"
      endpoint="city"
      fields={fields}
      accentColor="rose"
    />
  );
}
