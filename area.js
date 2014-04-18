/**
 * Created with JetBrains WebStorm.
 * User: vlebedev
 * Date: 18.04.14
 * Time: 12:05
 * To change this template use File | Settings | File Templates.
 */

var area = {
    element: document.getElementById("area"),
    board: [],
    config: {},
    build: function (x, y, config) {
        this.config = config || {
            padding: 3,
            width: 20,
            height: 20
        };

        var i, j,
            x = x || 10,
            y = y || 10,
            xOffset = 0,
            yOffset = 0,
            doc = document;

        this.element.style.width = x * (this.config.width + this.config.padding) + "px";
        this.element.style.height = y * (this.config.height + this.config.padding) + "px";

        var boardFragment = doc.createDocumentFragment();
        for (i = 0; i < x; i += 1) {
            this.board[i] = [];
            xOffset = xOffset + (this.config.width + this.config.padding);
            yOffset = 0;
            for (j = 0; j < y; j += 1) {
                yOffset = yOffset + (this.config.height + this.config.padding);
                var elt = doc.createElement('div');

                elt.className = "elt";
                elt.style.left = xOffset + "px";
                elt.style.top = yOffset + "px";
                elt.style.position = 'absolute';
                elt.style.width = this.config.width + "px";
                elt.style.height = this.config.height + "px";

                this.board[i][j] = elt;
                boardFragment.appendChild(elt);
            }
        }

        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }

        this.element.appendChild(boardFragment);

        return this;
    }
};

var element = {
    types: [],
    generate: function (type, config) {
        var shape = type || 'circle',
            strategy = this.types[shape],
            obj = strategy.render(config);
        return obj;
    }
};
element.types.circle = {
    render: function (config) {
        var doc = document,
            canvas = doc.createElement('canvas'),
            context = canvas.getContext('2d'),
            minvalue = Math.min(config.width, config.height),
            radius = (minvalue - minvalue * 0.2) / 2,
            centerX = config.width / 2,
            centerY = config.height / 2;

        canvas.width = config.width;
        canvas.height = config.height;

        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = config.color || '#FFFFFF';
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = config.color || '#00000';
        context.stroke();

        return canvas;
    }};

function Game() {
}

Game.Bubbles = function (area) {
    if (!area) {
        throw {
            name: "EmptyAreaException",
            message: "Area couldn't be empty"
        }
    }

    var i, j,
        maxX, maxY,
        type = 'circle',
        board = area.board,
        owner,
        colors = ['red', 'green', 'blue', 'violet', 'yellow'],
        colorAttr = 'data-color',
        config = area.config;

    var findSiblings = function (i, j) {
        var elt = board[i][j],
            color = elt.getAttribute(colorAttr),
            path = [];
        path.push(elt);

        function nearest(i, j) {
            //TODO: Hell
            var l = i - 1 < 0 ? undefined : board[i - 1][j],
                t = j + 1 < board[i].length ? board[i][j + 1] : undefined,
                r = i + 1 < board.length ? board[i + 1][j] : undefined,
                b = j - 1 < 0 ? undefined : board[i][j - 1];

            if (l && l.getAttribute(colorAttr) === color && path.indexOf(l) === -1) {
                path.push(l);
                nearest(i - 1, j);
            }
            if (t && t.getAttribute(colorAttr) === color && path.indexOf(t) === -1) {
                path.push(t);
                nearest(i, j + 1);
            }
            if (r && r.getAttribute(colorAttr) === color && path.indexOf(r) === -1) {
                path.push(r);
                nearest(i + 1, j);
            }
            if (b && b.getAttribute(colorAttr) === color && path.indexOf(b) === -1) {
                path.push(b);
                nearest(i, j - 1);
            }
        };
        nearest(i, j);
        return path.sort(function(a, b) {
            return a.getAttribute('y') - b.getAttribute('y');
        });
    }

    var shift = function (x, y) {
        var current = board[x][y],
            upper;

        while(current && current.firstChild) {
            current.removeChild(current.firstChild);
        }

        if (y > 0) {
            upper = board[x][y - 1];
            if (upper && upper.firstChild) {
                current.appendChild(upper.firstChild);
                current.setAttribute(colorAttr, upper.getAttribute(colorAttr));
                upper.setAttribute(colorAttr, '');
            }
            board[x][y] = current;
            if (y - 1 >= 0) {
                shift(x, y - 1);
            }
        }
    }

    for (i = 0, maxX = board.length; i < maxX; i += 1) {
        for (j = 0, maxY = board[i].length; j < maxY; j += 1) {
            owner = board[i][j];
            while (owner.firstChild) {
                owner.removeChild(owner.firstChild);
            }

            config.color = owner.getAttribute(colorAttr) || colors[Math.floor((Math.random() * 5))];

            owner.setAttribute(colorAttr, config.color);
            owner.setAttribute('x', i);
            owner.setAttribute('y', j);

            owner.addEventListener('click', function () {
                var n,
                    x = +this.getAttribute('x'),
                    y = +this.getAttribute('y'),
                    els = findSiblings(x, y),
                    max = els.length;

                for (n = 0; n < max; n += 1) {
                    //els[n].style.display = 'none';
                    var current = els[n],
                        x = +els[n].getAttribute('x'),
                        y = +els[n].getAttribute('y');

                    shift(x, y);
                }
            }, false);

            var item = element.generate(type, config);

            owner.appendChild(item);
        }
    }

    return this;
}


