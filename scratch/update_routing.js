const fs = require('fs');

let appCode = fs.readFileSync('xla-frontend/src/App.tsx', 'utf8');

const listsRoute = `          <Route path="utilities/lists" element={<ListsLayout />}>
            <Route index element={<Navigate to="doctors" replace />} />
            <Route path="doctors" element={<DoctorsListReport />} />
          </Route>`;

// Remove the route from inside Layout
appCode = appCode.replace(listsRoute, '');

// Add the route outside Layout, right before `<Route path="/" element={<Layout />}>`
appCode = appCode.replace(
  `<Route path="/" element={<Layout />}>`,
  listsRoute + `\n          <Route path="/" element={<Layout />}>`
);

fs.writeFileSync('xla-frontend/src/App.tsx', appCode);
console.log('App.tsx routing updated');
