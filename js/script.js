document.addEventListener('DOMContentLoaded', () => {
    const threadInput = document.getElementById('threadInput');
    const previewBtn = document.getElementById('previewBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const threadPreview = document.getElementById('threadPreview');
    const splitMethodRadios = document.getElementsByName('splitMethod');
    const numberingStyleRadios = document.getElementsByName('numberingStyle');

    const MAX_CHARS = 280;

    function getSelectedSplitMethod() {
        return document.querySelector('input[name="splitMethod"]:checked').value;
    }

    function getSelectedNumberingStyle() {
        return document.querySelector('input[name="numberingStyle"]:checked').value;
    }

    function splitIntoSentences(text) {
        // Split by common sentence endings
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        const threads = [];
        let currentThread = '';
        let currentCount = 0;

        sentences.forEach(sentence => {
            const trimmedSentence = sentence.trim();
            if (currentCount + trimmedSentence.length + 1 <= MAX_CHARS) {
                currentThread += (currentThread ? ' ' : '') + trimmedSentence;
                currentCount += trimmedSentence.length + (currentThread ? 1 : 0);
            } else {
                if (currentThread) {
                    threads.push(currentThread);
                }
                currentThread = trimmedSentence;
                currentCount = trimmedSentence.length;
            }
        });

        if (currentThread) {
            threads.push(currentThread);
        }

        return threads;
    }

    function splitIntoThreads(text) {
        const splitMethod = getSelectedSplitMethod();
        
        // Check for manual split using square brackets
        const manualParts = text.match(/\[(.*?)\]/g);
        
        if (manualParts && manualParts.length > 0) {
            // Process manually split parts
            const threads = [];
            
            // Extract content from square brackets
            const parts = manualParts.map(part => part.slice(1, -1).trim());
            
            parts.forEach(part => {
                if (part) {
                    if (splitMethod === 'sentence') {
                        threads.push(...splitIntoSentences(part));
                    } else {
                        // Word-based splitting
                        const words = part.split(' ');
                        let currentThread = '';
                        let currentCount = 0;

                        words.forEach(word => {
                            if (currentCount + word.length + 1 <= MAX_CHARS) {
                                currentThread += (currentThread ? ' ' : '') + word;
                                currentCount += word.length + (currentThread ? 1 : 0);
                            } else {
                                if (currentThread) {
                                    threads.push(currentThread);
                                }
                                currentThread = word;
                                currentCount = word.length;
                            }
                        });

                        if (currentThread) {
                            threads.push(currentThread);
                        }
                    }
                }
            });

            return threads;
        }

        // If no manual split, continue with normal processing
        if (splitMethod === 'sentence') {
            return splitIntoSentences(text);
        }

        // Default word-based splitting
        const words = text.split(' ');
        const threads = [];
        let currentThread = '';
        let currentCount = 0;

        words.forEach(word => {
            if (currentCount + word.length + 1 <= MAX_CHARS) {
                currentThread += (currentThread ? ' ' : '') + word;
                currentCount += word.length + (currentThread ? 1 : 0);
            } else {
                if (currentThread) {
                    threads.push(currentThread);
                }
                currentThread = word;
                currentCount = word.length;
            }
        });

        if (currentThread) {
            threads.push(currentThread);
        }

        return threads;
    }

    function getThreadNumbering(index, total) {
        const style = getSelectedNumberingStyle();
        
        switch (style) {
            case 'fraction':
                return ` (${index + 1}/${total})`;
            case 'plus':
                const plusCount = Math.min(index + 1, 3);
                return ' ' + '+'.repeat(plusCount);
            default:
                return '';
        }
    }

    function createThreadPreview(threads) {
        threadPreview.innerHTML = '';
        
        threads.forEach((thread, index) => {
            const tweetDiv = document.createElement('div');
            tweetDiv.className = 'tweet';
            
            const tweetNumber = document.createElement('div');
            tweetNumber.className = 'tweet-number';
            tweetNumber.textContent = `${index + 1}/${threads.length}`;
            
            const tweetContent = document.createElement('div');
            tweetContent.className = 'tweet-content';
            tweetContent.textContent = thread + getThreadNumbering(index, threads.length);
            
            tweetDiv.appendChild(tweetNumber);
            tweetDiv.appendChild(tweetContent);
            threadPreview.appendChild(tweetDiv);
        });
    }

    function copyThreadToClipboard(threads) {
        const numberingStyle = getSelectedNumberingStyle();
        let text = '';
        
        threads.forEach((thread, index) => {
            const numbering = getThreadNumbering(index, threads.length);
            text += thread + numbering + '\n\n';
        });

        navigator.clipboard.writeText(text.trim())
            .then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    }

    function downloadThreadAsText(threads) {
        const numberingStyle = getSelectedNumberingStyle();
        let content = '';
        
        threads.forEach((thread, index) => {
            const numbering = getThreadNumbering(index, threads.length);
            content += `Post ${index + 1}:\n${thread}${numbering}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'post-thread.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    function updatePreview() {
        const text = threadInput.value.trim();
        if (text) {
            const threads = splitIntoThreads(text);
            createThreadPreview(threads);
        }
    }

    let previewTimeout;
    threadInput.addEventListener('input', () => {
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(updatePreview, 500);
    });

    // Update preview when preferences change
    [...splitMethodRadios, ...numberingStyleRadios].forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });

    // Event Listeners
    previewBtn.addEventListener('click', () => {
        const text = threadInput.value.trim();
        if (text) {
            const threads = splitIntoThreads(text);
            createThreadPreview(threads);
        }
    });

    copyBtn.addEventListener('click', () => {
        const text = threadInput.value.trim();
        if (text) {
            const threads = splitIntoThreads(text);
            copyThreadToClipboard(threads);
        }
    });

    downloadBtn.addEventListener('click', () => {
        const text = threadInput.value.trim();
        if (text) {
            const threads = splitIntoThreads(text);
            downloadThreadAsText(threads);
        }
    });
});
