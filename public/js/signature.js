const sigDiv = $("#signature-container")[0];
new window.p5(p5 => {
    p5.setup = function() {
        p5.createCanvas(sigDiv.clientWidth, sigDiv.clientHeight);
        p5.strokeWeight(3);
    };

    p5.windowResized = () => {
        p5.resizeCanvas(sigDiv.clientWidth, sigDiv.clientHeight);
        p5.redraw();
    };

    p5.mouseDragged = () => {
        p5.line(p5.pmouseX, p5.pmouseY, p5.mouseX, p5.mouseY);
    };
}, sigDiv);

$("#signature-form").submit(e => {
    e.preventDefault();
    $.ajax({
        method: "POST",
        url: "/petition",
        data: {
            firstName: $('input[name="fname"]').val(),
            lastName: $('input[name="lname"]').val(),
            email: $('input[name="email"]').val(),
            signature: $(".p5Canvas")[0].toDataURL("png")
        }
    });
});
