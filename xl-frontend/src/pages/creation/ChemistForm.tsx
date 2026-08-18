import MobileForm from '../../components/MobileForm';

const fields = [
  { name: 'businessName', label: 'Business Name', required: true, placeholder: 'Chemist shop name' },
  { name: 'proprietorName', label: 'Proprietor Name', placeholder: 'Owner full name' },
  { name: 'certification', label: 'Drug License / Certification', placeholder: 'License number' },
  { name: 'mobileNumber', label: 'Mobile Number', type: 'tel', placeholder: '10-digit mobile' },
  { name: 'emailAddress', label: 'Email Address', type: 'email', placeholder: 'chemist@email.com' },
  { name: 'hq', label: 'HQ', required: true, placeholder: 'Headquarter city' },
  { name: 'workingArea', label: 'Working Area', placeholder: 'Area / locality' },
  { name: 'birthday', label: 'Proprietor Birthday', type: 'date' },
  { name: 'address', label: 'Address', placeholder: 'Full address' },
  { name: 'extraInfo', label: 'Extra Info / Notes', placeholder: 'Any additional notes' },
];

export default function ChemistForm() {
  return (
    <MobileForm
      title="Add Chemist"
      subtitle="Create a new chemist profile"
      endpoint="chemist"
      fields={fields}
      accentColor="emerald"
      enableGeoTagging={true}
    />
  );
}
