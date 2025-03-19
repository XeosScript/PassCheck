document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const strengthProgress = document.getElementById('strengthProgress');
    const strengthLabel = document.getElementById('strengthLabel');
    const resultDiv = document.getElementById('result');
    const generateButton = document.getElementById('generateButton');
    const entropyElement = document.getElementById('entropy');
    const combinationsElement = document.getElementById('combinations');
    const crackTimesTableBody = document.querySelector('#crackTimes tbody');



    function generatePassword(length = 12) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset.charAt(randomIndex);
        }
        return password;
    }

    generateButton.addEventListener('click', function() {
        const newPassword = generatePassword();
        passwordInput.value = newPassword;
        updateStrength(newPassword);
    });


    function updateStrength(password) {

        while (crackTimesTableBody.firstChild) {
            crackTimesTableBody.removeChild(crackTimesTableBody.firstChild);
        }
        resultDiv.querySelector('ul')?.remove();



        const result = checkPasswordStrength(password);
        let percentage = calculatePercentage(result);


        if (percentage > 100)  {
            strengthProgress.style.width = `${percentage}%`;
        } else {
            strengthProgress.style.width = '300px';
            percentage = Math.min(percentage, 100);
        }


        strengthProgress.value = percentage;
        strengthLabel.textContent = result.strength;
        updateProgressBarColor(strengthProgress, result.color, percentage);

        entropyElement.textContent = `Энтропия: ${result.entropy.toFixed(2)} бит`;
        combinationsElement.textContent = `Количество комбинаций: ${result.combinationsFormatted}`;

        const crackingSpeeds = {
            "1 Thousand/sec": 1000,
            "1 Million/sec": 1000000,
            "1 Billion/sec": 1000000000,
            "100 Billion/sec": 100000000000,
            "1 Trillion/sec": 1000000000000
        };

        for (const speed in crackingSpeeds) {
            const crackTime = estimateCrackTime(result.entropy, crackingSpeeds[speed]);
            const row = document.createElement('tr');
            const speedCell = document.createElement('td');
            speedCell.textContent = speed;
            const timeCell = document.createElement('td');
            timeCell.textContent = formatCrackTime(crackTime, result.combinations);
            row.appendChild(speedCell);
            row.appendChild(timeCell);
            crackTimesTableBody.appendChild(row);
        }



        if (result.reasons.length > 0) {
            const reasonsList = document.createElement('ul');
            result.reasons.forEach(reason => {
                const listItem = document.createElement('li');
                listItem.textContent = reason;
                reasonsList.appendChild(listItem);
            });
            resultDiv.appendChild(reasonsList);
        }
    }



    passwordInput.addEventListener('input', function() {
        updateStrength(this.value);
    });

    updateStrength(passwordInput.value);


    function calculatePercentage(result) {
        let percentage = 0;
        switch (result.strength) {
            case "Очень слабый":
                percentage = 10;
                break;
            case "Слабый":
                percentage = 30;
                break;
            case "Средний":
                percentage = 50;
                break;
            case "Сильный":
                percentage = 75;
                break;
            case "Очень сильный":
                if(result.combinations > 1e29) {
                    percentage = 200;
                }
                else percentage = 100;
                break;
            case "Невероятно сильный":
                percentage = 200;
                break;
            default:
                percentage = 0;
        }
        return percentage;
    }


    function updateProgressBarColor(progressBar, color, percentage) {
        progressBar.style.setProperty('--progress-color', color);

        progressBar.style.setProperty('background-color', '#eee');
        if (progressBar.hasOwnProperty('value')) {
            let gradient;
            if (percentage > 100) {
                gradient = `linear-gradient(to right, gold ${percentage}%, #eee ${percentage}%)`;
                progressBar.style.setProperty('background', gradient);
                progressBar.style.setProperty('--progress-value-color', "gold");

            }  else {

                gradient = `linear-gradient(to right, ${color} ${percentage}%, #eee ${percentage}%)`;
                progressBar.style.setProperty('color', color);
                progressBar.style.setProperty('--progress-value-color', color);
                progressBar.style.setProperty('background', gradient);
            }


        }
    }


});


function checkPasswordStrength(password) {
    let entropy = calculateEntropy(password);
    let strength = "Очень слабый";
    let color = "red";
    let reasons = [];

    if (password.length < 8) reasons.push("Слишком короткий пароль (минимум 8 символов)");
    if (!/[A-Z]/.test(password)) reasons.push("Отсутствуют заглавные буквы");
    if (!/[a-z]/.test(password)) reasons.push("Отсутствуют строчные буквы");
    if (!/[0-9]/.test(password)) reasons.push("Отсутствуют цифры");
    if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) reasons.push("Отсутствуют специальные символы");

    const combinations = Math.pow(2, entropy);

    if (combinations > 1e60) {
        strength = "Что ты там защищаешь?";
        color = "gold";
    } else if (combinations > 1e29) {
        strength = "Невероятно сильный";
        color = "darkgreen";
    } else if (combinations > 1e12) {
        strength = "Очень сильный";
        color = "green";
    } else if (combinations > 1e9) {
        strength = "Сильный";
        color = "green";
    } else if (combinations > 1e6) {
        strength = "Средний";
        color = "orange";
        if (reasons.length === 0) reasons.push("Добавьте больше заглавных букв, цифр или спец. символов для большей надежности");
    } else if (password.length > 0){
        strength = "Слабый";
        color = "red";
    }


    return {
        strength: strength,
        color: color,
        entropy: entropy,
        combinations: combinations,
        combinationsFormatted: formatNumber(combinations),
        reasons: reasons
    };
}

function calculateEntropy(password) {
    let entropy = 0;
    let charSetSize = 0;

    if (/[a-z]/.test(password)) charSetSize += 26;
    if (/[A-Z]/.test(password)) charSetSize += 26;
    if (/[0-9]/.test(password)) charSetSize += 10;
    if (/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) charSetSize += 33;

    if (charSetSize === 0) return 0;

    entropy = password.length * Math.log2(charSetSize);
    return entropy;
}

function estimateCrackTime(entropy, guessesPerSecond) {
    const possibleCombinations = Math.pow(2, entropy);
    const seconds = possibleCombinations / guessesPerSecond;

    let years = Math.floor(seconds / (365 * 24 * 3600));
    let months = Math.floor((seconds % (365 * 24 * 3600)) / (30 * 24 * 3600));
    let days = Math.floor((seconds % (30 * 24 * 3600)) / (24 * 3600));
    let hours = Math.floor((seconds % (24 * 3600)) / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = Math.floor(seconds % 60);

    return {
        years,
        months,
        days,
        hours,
        minutes,
        seconds: remainingSeconds,
        combinations: Math.pow(2, entropy)
    };
}

function formatCrackTime(crackTime, combinations) {
    if (combinations > 1e99) {
        return "error 404";
    } else if (combinations > 1e60) {
        return "Для взлома потребуется энергия, превышающая вселенскую";
    } else if (combinations > 1e50) {
        return "Прекрати, твой пароль уже никому не нужен";
    } else if (combinations > 1e35) {
        return "Этот пароль переживет мироздание";
    } else if (combinations > 1e29) {
        return "Не думаю, что с квантовым компьютером это получится взломать";
    }

    if (crackTime.years > 1000) {
        return "Бесконечно долго";
    }
    if (crackTime.years > 1) {
        return `${crackTime.years} лет`;
    } else if (crackTime.years === 1) {
        return "1 год";
    } else if (crackTime.months > 1) {
        return `${crackTime.months} месяцев`;
    } else if (crackTime.months === 1) {
        return "1 месяц";
    } else if (crackTime.days > 1) {
        return `${crackTime.days} дней`;
    } else if (crackTime.days === 1) {
        return "1 день";
    } else if (crackTime.hours > 1) {
        return `${crackTime.hours} часов`;
    } else if (crackTime.hours === 1) {
        return "1 час";
    } else if (crackTime.minutes > 1) {
        return `${crackTime.minutes} минут`;
    } else if (crackTime.minutes === 1) {
        return "1 минуту";
    } else {
        return `${crackTime.seconds} секунд`;
    }
}


function formatNumber(number) {
    const formatter = new Intl.NumberFormat('ru-RU');
    return formatter.format(number);
}
