function numberToWords(num) {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    const count = (n) => {
        if (n < 20) return a[n];
        let s = b[Math.floor(n / 10)];
        if (n % 10 > 0) s += ' ' + a[n % 10];
        return s;
    };

    if (num === 0) return 'zero';
    let words = '';
    
    if (Math.floor(num / 10000000) > 0) {
        words += count(Math.floor(num / 10000000)) + ' crore ';
        num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
        words += count(Math.floor(num / 100000)) + ' lakh ';
        num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
        words += count(Math.floor(num / 1000)) + ' thousand ';
        num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
        words += count(Math.floor(num / 100)) + ' hundred ';
        num %= 100;
    }
    if (num > 0) {
        if (words !== '') words += 'and ';
        words += count(num);
    }
    return words.trim().toLowerCase();
}

function resolveTemplate(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
        const placeholder = `{{${key}}}`;
        result = result.split(placeholder).join(value || '');
    }
    return result;
}

module.exports = {
    numberToWords,
    resolveTemplate
};
