const fs = require('fs');

// --- 1. Patch db.js ---
let dbJs = fs.readFileSync('db.js', 'utf8');
if (!dbJs.includes('targetProductsList:')) {
    dbJs = dbJs.replace('activeExamProduct: { type: DataTypes.STRING, defaultValue: "" },',
        'activeExamProduct: { type: DataTypes.STRING, defaultValue: "" },\n    targetProductsList: { type: DataTypes.JSON, defaultValue: ["General", "Emystein", "Briskheal"] },');
    fs.writeFileSync('db.js', dbJs);
    console.log('Patched db.js');
}

// --- 2. Patch admin.html ---
let adminHtml = fs.readFileSync('admin.html', 'utf8');
const card175 = `<!-- Card 1.75: Letter Templates Launcher -->`;
const card16 = `<!-- Card 1.6: Manage Target Products -->
                            <div class="setup-section">
                                <div class="setup-section-head">
                                    <h4>🎯 Manage Target Products</h4>
                                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Add products that can be tested in the Question Bank and Exam Scheduler.</p>
                                </div>
                                <div id="targetProductList" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1rem;">
                                    <!-- Dynamic chips go here -->
                                </div>
                                <div style="display: flex; gap: 10px; align-items: flex-end;">
                                    <div class="form-group" style="flex: 1;">
                                        <label>Product Name</label>
                                        <input type="text" id="profileNewProductInput" class="form-input-sm" placeholder="e.g. Product X" style="width: 100%;">
                                    </div>
                                    <button type="button" class="btn btn-primary" onclick="addTargetProduct()" style="height: 42px; padding: 0 1.5rem;">+ Add Product</button>
                                </div>
                            </div>
                            
                            <!-- Card 1.75: Letter Templates Launcher -->`;
if (!adminHtml.includes('Manage Target Products')) {
    adminHtml = adminHtml.replace(card175, card16);
}

const oldActiveExamProduct = `<select id="activeExamProductInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">
                                        <option value="General">General / All</option>
                                        <option value="Emystein">Emystein</option>
                                        <option value="Briskheal">Briskheal</option>
                                    </select>`;
const newActiveExamProduct = `<select id="activeExamProductInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">
                                        <option value="General">General / All</option>
                                    </select>`;
if (adminHtml.includes(oldActiveExamProduct)) adminHtml = adminHtml.replace(oldActiveExamProduct, newActiveExamProduct);

const oldQTargetProduct = `<select id="q_targetProduct" style="width: 100%;" class="form-input">
                            <option value="General">General / Not Applicable</option>
                            <option value="Emystein">Emystein</option>
                            <option value="Briskheal">Briskheal</option>
                        </select>`;
const newQTargetProduct = `<select id="q_targetProduct" style="width: 100%;" class="form-input">
                            <option value="General">General / Not Applicable</option>
                        </select>`;
if (adminHtml.includes(oldQTargetProduct)) adminHtml = adminHtml.replace(oldQTargetProduct, newQTargetProduct);

fs.writeFileSync('admin.html', adminHtml);
console.log('Patched admin.html');

// --- 3. Patch admin-script.js ---
let adminScript = fs.readFileSync('admin-script.js', 'utf8');

// Inject logic into applyCompanyData
if (!adminScript.includes('renderTargetProductsList();')) {
    adminScript = adminScript.replace('if (companyData.stamp && companyData.stamp.length > 0) {', 
        'renderTargetProductsList();\n    populateTargetProductDropdowns();\n\n    if (companyData.stamp && companyData.stamp.length > 0) {');
}

// Inject new functions
const newFunctions = `
function renderTargetProductsList() {
    const listEl = document.getElementById('targetProductList');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (!companyData.targetProductsList) companyData.targetProductsList = ['General', 'Emystein', 'Briskheal'];
    
    companyData.targetProductsList.forEach((prod, i) => {
        const div = document.createElement('div');
        div.className = 'department-tag';
        div.style = 'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);';
        div.innerHTML = \`
            <span>\${prod}</span>
            \${prod !== 'General' ? \`<span class="department-remove" onclick="deleteTargetProduct('\${prod}')">&times;</span>\` : ''}
        \`;
        listEl.appendChild(div);
    });
}

function populateTargetProductDropdowns() {
    if (!companyData.targetProductsList) return;
    const qDrop = document.getElementById('q_targetProduct');
    const schDrop = document.getElementById('activeExamProductInput');
    
    const buildOptions = (includeAll) => {
        let html = includeAll ? '<option value="General">General / All</option>' : '<option value="General">General / Not Applicable</option>';
        companyData.targetProductsList.forEach(p => {
            if(p !== 'General') html += \`<option value="\${p}">\${p}</option>\`;
        });
        return html;
    };
    
    if (qDrop) qDrop.innerHTML = buildOptions(false);
    if (schDrop) {
        const currentVal = schDrop.value;
        schDrop.innerHTML = buildOptions(true);
        if (currentVal && companyData.targetProductsList.includes(currentVal)) {
            schDrop.value = currentVal;
        }
    }
}

async function addTargetProduct() {
    const input = document.getElementById('profileNewProductInput');
    if (!input || !input.value.trim()) return;
    const val = input.value.trim();
    if (!companyData.targetProductsList) companyData.targetProductsList = ['General'];
    
    if (!companyData.targetProductsList.includes(val)) {
        companyData.targetProductsList.push(val);
        await submitProfileUpdate({ targetProductsList: companyData.targetProductsList }, true);
        input.value = '';
        renderTargetProductsList();
        populateTargetProductDropdowns();
        showToast("Product Added!");
    } else {
        alert("Product already exists.");
    }
}

async function deleteTargetProduct(prod) {
    if (prod === 'General') return;
    if (!confirm('Remove ' + prod + '? Existing questions will keep this tag but you cannot schedule new exams for it.')) return;
    
    companyData.targetProductsList = companyData.targetProductsList.filter(p => p !== prod);
    await submitProfileUpdate({ targetProductsList: companyData.targetProductsList }, true);
    renderTargetProductsList();
    populateTargetProductDropdowns();
    showToast("Product Removed");
}
`;

if (!adminScript.includes('function addTargetProduct()')) {
    adminScript = adminScript + newFunctions;
}

// Ensure Enter Key listener
const enterKeyLogic = `const prodInput = document.getElementById('profileNewProductInput');
    if (prodInput) prodInput.onkeydown = (e) => handleEnter(e, addTargetProduct);`;
if (!adminScript.includes('profileNewProductInput')) {
    adminScript = adminScript.replace('const hqInput = document.getElementById(\'profileNewHQInput\');', 
        enterKeyLogic + '\n\n    const hqInput = document.getElementById(\'profileNewHQInput\');');
}

fs.writeFileSync('admin-script.js', adminScript);
console.log('Patched admin-script.js');
