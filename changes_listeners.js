var stdin = process.openStdin();

stdin.setEncoding('utf8');

var buffer = '';

stdin.on('data', function (chunk) {
  buffer += chunk.toString();
  while (buffer.indexOf('\n') !== -1) {
    line = buffer.slice(0, buffer.indexOf('\n'));
    buffer = buffer.slice(buffer.indexOf('\n') + 1);  
    var obj = JSON.parse(line);
    if (obj[0] === "change") {
      listener(obj[1]);
    }
  }
});
