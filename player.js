document.addEventListener('DOMContentLoaded', function() {
    const player = videojs('my-video', {
        fluid: true,
        responsive: true,
        aspectRatio: '16:9',
        // Add custom classes to the player
        className: 'vjs-custom-theme',
        // Customize control bar
        controlBar: {
            children: [
                'playToggle',
                'volumePanel',
                'currentTimeDisplay',
                'timeDivider',
                'durationDisplay',
                'progressControl',
                'fullscreenToggle',
            ],
        }
    });
    const fileInput = document.getElementById('file-input');
    const timestampList = document.getElementById('timestamp-list');
    const videoContainer = document.getElementById('video-container');
    const videoPlaceholder = document.getElementById('video-placeholder');

    let videoSelected = false;

    const chooseTimestampBtn = document.getElementById('choose-timestamp-btn');
    const addTimestampBtn = document.getElementById('add-timestamp-btn');
    const timestampFileInput = document.getElementById('timestamp-file-input');

    let timestamps = [];

    function enableTimestampButtons() {
        console.log('Enabling timestamp buttons');
        chooseTimestampBtn.disabled = false;
        addTimestampBtn.disabled = false;
    }

    function disableTimestampButtons() {
        console.log('Disabling timestamp buttons');
        chooseTimestampBtn.disabled = true;
        addTimestampBtn.disabled = true;
    }

    function showPlaceholder() {
        console.log('Showing placeholder');
        videoPlaceholder.style.display = 'flex';
        player.hide();
        videoSelected = false;
        disableTimestampButtons();
    }

    function hidePlaceholder() {
        console.log('Hiding placeholder');
        videoPlaceholder.style.display = 'none';
        player.show();
        videoSelected = true;
        enableTimestampButtons();
        
        // Force button state
        chooseTimestampBtn.disabled = false;
        addTimestampBtn.disabled = false;
        console.log('Choose button disabled:', chooseTimestampBtn.disabled);
        console.log('Add button disabled:', addTimestampBtn.disabled);
    }

    showPlaceholder(); // Initially show the placeholder

    videoContainer.addEventListener('click', function(e) {
        if (!videoSelected) {
            fileInput.click();
        }
        // If video is selected, allow default video player behavior
    });

    fileInput.addEventListener('change', function(e) {
        console.log('File input changed');
        const file = e.target.files[0];
        if (file && file.type.startsWith('video/')) {
            console.log('Valid video file selected');
            const fileURL = URL.createObjectURL(file);
            player.src({ type: file.type, src: fileURL });
            hidePlaceholder();
        }
    });

    chooseTimestampBtn.addEventListener('click', function() {
        console.log('Choose timestamp button clicked');
        timestampFileInput.click();
    });

    timestampFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    timestamps = jsonData.timestamps;
                    displayTimestamps();
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    alert('Invalid timestamp file format');
                }
            };
            reader.readAsText(file);
        }
    });

    function displayTimestamps() {
        timestampList.innerHTML = '';
        timestamps.forEach(timestamp => {
            const button = createTimestampButton(timestamp);
            timestampList.appendChild(button);
        });
    }

    function createTimestampButton(timestamp) {
        const button = document.createElement('button');
        button.classList.add('timestamp-button');
        
        const timeText = document.createElement('span');
        timeText.textContent = timestamp.time;
        timeText.classList.add('time-text');
        button.appendChild(timeText);
        
        const comment = document.createElement('span');
        comment.textContent = timestamp.comment;
        comment.classList.add('comment');
        button.appendChild(comment);
        
        button.addEventListener('click', function() {
            const time = parseTimestamp(timestamp.time);
            player.currentTime(time);
            player.play();
        });

        return button;
    }

    function parseTimestamp(timestamp) {
        const [hours, minutes, seconds] = timestamp.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    addTimestampBtn.addEventListener('click', function() {
        const currentTime = player.currentTime();
        const formattedTime = formatTime(currentTime);
        const comment = prompt('Enter a comment for this timestamp:', '');
        
        if (comment !== null) {
            timestamps.push({ time: formattedTime, comment: comment });
            timestamps.sort((a, b) => parseTimestamp(a.time) - parseTimestamp(b.time));
            displayTimestamps();
        }
    });

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Update this function to return a promise
    function captureVideoFrame(time, button, canvas, context) {
        return new Promise((resolve) => {
            player.currentTime(time);
            player.one('seeked', function() {
                canvas.width = player.videoWidth() / 4;  // Adjust size as needed
                canvas.height = player.videoHeight() / 4;
                context.drawImage(player.el().querySelector('video'), 0, 0, canvas.width, canvas.height);
                
                // Clear existing content
                button.innerHTML = '';
                
                // Create and add screenshot
                const screenshot = document.createElement('img');
                screenshot.src = canvas.toDataURL();
                screenshot.classList.add('screenshot');
                button.appendChild(screenshot);
                
                // Add time text
                const timeText = document.createElement('span');
                timeText.textContent = formatTime(time);
                timeText.classList.add('time-text');
                button.appendChild(timeText);
                
                // Add comment (placeholder for now)
                const comment = document.createElement('span');
                comment.textContent = 'Add a comment';
                comment.classList.add('comment');
                button.appendChild(comment);
                
                resolve();
            });
        });
    }

    // Update drag and drop functionality
    videoContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!videoSelected) {
            this.style.background = '#f0f0f0';
        }
    });

    videoContainer.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!videoSelected) {
            this.style.background = 'none';
        }
    });

    videoContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!videoSelected) {
            this.style.background = 'none';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                const fileURL = URL.createObjectURL(file);
                player.src({ type: file.type, src: fileURL });
                hidePlaceholder();
            }
        }
    });
});
