try {
    const d = new Date(undefined);
    const yyyyMm = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    console.log("Success:", yyyyMm);
} catch(e) {
    console.error("Error:", e.message);
}
