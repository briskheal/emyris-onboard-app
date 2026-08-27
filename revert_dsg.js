const axios = require('axios');
const idsToDelete = [
  'ty7f1g4kpgmt9uia6i', '8ziayrantp5mt9uia84', 'web4u5ywkbnmt9uia9a', 'ltwi88iwc7rmt9uiaaj',
  'za3r1x910ydmt9uiabp', 'e0125m47demt9uiacy', 'pxxyeaprwlmt9uiae4', 'v60evprjzxmt9uiaf5', 'sdux7q6hk3cmt9uiag0'
];
async function revert() {
  for (const id of idsToDelete) {
    try {
      await axios.delete('https://emyrishr.in/api/admin/locations/designations/' + id);
      console.log('Deleted ' + id);
    } catch(e) {
      console.log('Failed ' + id);
    }
  }
}
revert();
