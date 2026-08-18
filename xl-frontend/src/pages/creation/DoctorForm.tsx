import MobileForm from '../../components/MobileForm';

const fields = [
  { name: 'name', label: 'Doctor Name', required: true, placeholder: 'Dr. Full Name' },
  { name: 'degree', label: 'Degree', placeholder: 'e.g. MBBS, MD, DM' },
  { name: 'specialization', label: 'Specialization', placeholder: 'e.g. Cardiologist, GP' },
  { name: 'hospital', label: 'Hospital / Clinic', placeholder: 'Hospital name' },
  { name: 'category', label: 'Category', options: ['A+', 'A', 'B', 'C', 'D'] },
  { name: 'mobileNumber', label: 'Mobile Number', type: 'tel', placeholder: '10-digit mobile' },
  { name: 'contactNumber', label: 'Contact / Clinic No.', type: 'tel', placeholder: 'Alternate number' },
  { name: 'emailAddress', label: 'Email Address', type: 'email', placeholder: 'doctor@email.com' },
  { name: 'hq', label: 'HQ', required: true, placeholder: 'Headquarter city' },
  { name: 'workingArea', label: 'Working Area', placeholder: 'Area / locality' },
  { name: 'birthday', label: 'Birthday', type: 'date' },
  { name: 'anniversary', label: 'Anniversary', type: 'date' },
  { name: 'address', label: 'Address', placeholder: 'Full address' },
  { name: 'extraInfo', label: 'Extra Info / Notes', placeholder: 'Any additional notes' },
];

export default function DoctorForm() {
  return (
    <MobileForm
      title="Add Doctor"
      subtitle="Create a new doctor profile"
      endpoint="doctor"
      fields={fields}
      accentColor="sky"
    />
  );
}
