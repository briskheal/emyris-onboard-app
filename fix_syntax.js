const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');

// The broken section at line 913-918:
// Missing: catch clause for the OUTER try in save-template route
// Current broken code:
//        } catch (histErr) {
//            console.warn(...)
//        }
//    }                          <-- this closes the outer try body, but no catch!
// 
// (blank line)
// router.get('/applicant/:email'  <-- next route starts immediately

const broken = `        } catch (histErr) {\r\n            console.warn('⚠️ Failed to save history entry:', histErr.message);\r\n        }\r\n    }\n\nrouter.get('/applicant/:email'`;

const fixed = `        } catch (histErr) {\r\n            console.warn('⚠️ Failed to save history entry:', histErr.message);\r\n        }\r\n    } catch (err) {\r\n        console.error('Save template error:', err);\r\n        res.status(500).json({ success: false, message: err.message });\r\n    }\r\n});\r\n\r\nrouter.get('/applicant/:email'`;

if (admin.includes(broken)) {
    admin = admin.replace(broken, fixed);
    console.log('Fixed save-template syntax error!');
} else {
    // Try with \n instead of \r\n
    const broken2 = `        } catch (histErr) {\n            console.warn('⚠️ Failed to save history entry:', histErr.message);\n        }\n    }\n\nrouter.get('/applicant/:email'`;
    if (admin.includes(broken2)) {
        admin = admin.replace(broken2, `        } catch (histErr) {\n            console.warn('⚠️ Failed to save history entry:', histErr.message);\n        }\n    } catch (err) {\n        console.error('Save template error:', err);\n        res.status(500).json({ success: false, message: err.message });\n    }\n});\n\nrouter.get('/applicant/:email'`);
        console.log('Fixed with LF variant!');
    } else {
        // Just do it by line number manipulation
        const lines = admin.split('\n');
        // Find the line with just "    }" before "router.get('/applicant"
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '}' && 
                lines[i+1] !== undefined && 
                lines[i+1].trim() === '' &&
                lines[i+2] !== undefined && 
                lines[i+2].includes("router.get('/applicant/:email'")) {
                // Insert the missing catch
                lines.splice(i, 1, 
                    '    } catch (err) {',
                    '        console.error("Save template error:", err);',
                    '        res.status(500).json({ success: false, message: err.message });',
                    '    }',
                    '});'
                );
                console.log('Fixed by line injection at line', i+1);
                break;
            }
        }
        admin = lines.join('\n');
    }
}

fs.writeFileSync('routes/admin.js', admin);
