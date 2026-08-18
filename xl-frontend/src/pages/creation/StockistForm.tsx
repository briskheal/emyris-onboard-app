import MobileForm from '../../components/MobileForm';

const fields = [
  { name: 'businessName', label: 'Business Name', required: true, placeholder: 'Stockist company name' },
  { name: 'proprietorName', label: 'Proprietor Name', placeholder: 'Owner full name' },
  { name: 'certification', label: 'Drug License No.', placeholder: 'Drug license number' },
  { name: 'gstNumber', label: 'GST Number', placeholder: 'GST registration number' },
  { name: 'drugLicenseExpiry', label: 'Drug License Expiry', type: 'date' },
  { name: 'establishmentDate', label: 'Establishment Date', type: 'date' },
  { name: 'mobileNumber', label: 'Mobile Number', type: 'tel', placeholder: '10-digit mobile' },
  { name: 'emailAddress', label: 'Email Address', type: 'email', placeholder: 'stockist@email.com' },
  { name: 'hq', label: 'HQ', required: true, placeholder: 'Headquarter city' },
  { name: 'workingArea', label: 'Working Area', placeholder: 'Area / locality' },
  { name: 'address', label: 'Address', placeholder: 'Full address' },
  { name: 'extraInfo', label: 'Extra Info / Notes', placeholder: 'Any additional notes' },
];

export default function StockistForm() {
  return (
    <MobileForm
      title="Add Stockist"
      subtitle="Create a new stockist / distributor"
      endpoint="stockist"
      fields={fields}
      accentColor="amber"
    />
  );
}
