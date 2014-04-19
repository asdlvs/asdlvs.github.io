/**
 * Created with JetBrains WebStorm.
 * User: vlebedev
 * Date: 18.04.14
 * Time: 12:05
 * To change this template use File | Settings | File Templates.
 */

(function () {
    //Create board
    var area = {
        element: document.getElementById("area"),
        board: [],
        config: {},
        build: function (cols, rows, config) {
            this.config = config || {
                padding: 3,
                width: 20,
                height: 20
            };

            var i, j,
                x = cols || 10,
                rows = rows || 10,
                xOffset = 0,
                yOffset = 0,
                doc = document,
                style = this.element.style;

            style.width = x * (this.config.width + this.config.padding) + "px";
            style.height = rows * (this.config.height + this.config.padding) + "px";

            var boardFragment = doc.createDocumentFragment();
            for (i = 0; i < x; i += 1) {
                this.board[i] = [];
                xOffset = i * (this.config.width + this.config.padding);
                yOffset = 0;
                for (j = 0; j < rows; j += 1) {
                    yOffset = j * (this.config.height + this.config.padding);
                    var elt = doc.createElement('div'),
                        style = elt.style;

                    elt.className = "elt";
                    style.left = this.element.offsetLeft + xOffset + "px";
                    style.top = this.element.offsetTop + yOffset + "px";
                    style.position = 'absolute';
                    style.width = this.config.width + "px";
                    style.height = this.config.height + "px";

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

    //Visual elements
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

    //Algorithms
    var algorithms = {};
    algorithms.siblingSearch = function (board, coords, condition, sort) {
        var elt = board[coords.x][coords.y],
            path = [elt];

        var discr = condition(elt);
        (function nearestRecursive(x, y) {
            var siblings = [],
                i, max;
            x - 1 >= 0 && siblings.push({ x: x - 1, y: y });
            y + 1 < board[x].length && siblings.push({ x: x, y: y + 1 });
            x + 1 < board.length && siblings.push({ x: x + 1, y: y });
            y - 1 >= 0 && siblings.push({ x: x, y: y - 1 });

            for (i = 0, max = siblings.length; i < max; i += 1) {
                var coords = siblings[i],
                    item = board[coords.x][coords.y];

                if (discr === condition(item) && path.indexOf(item) === -1) {
                    path.push(item);
                    nearestRecursive(coords.x, coords.y);
                }
            }
        }(coords.x, coords.y));

        return path.sort(sort);
    }

    function Game(name) {
        if (Game[name] === "undefined") {
            throw {
                name: "GameNotFoundException",
                message: "There are no game *" + name + "*"
            };
        }
        return Game[name];
    }

    Game.Bubbles = function (area, callback) {
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
            colors = ['#ff0033', '#7fff00', '#0047ab', '#4b0082', '#fbec5d'],
            colorAttr = 'data-color',
            config = area.config,
            score = 0,
            updateScore = function (add) {
                score += add;
                callback(score);
            },
            calculateScore = function (count) {
                return count * count;
            },
            clearElt = function (elt) {
                while (elt.firstChild) {
                    elt.removeChild(elt.firstChild);
                }
            },
            shift = function (els) {
                var i, max;

                for (i = 0, max = els.length; i < max; i += 1) {
                    shiftElt(els[i]);
                }
                function shiftElt(current) {
                    var upper,
                        x = current.getAttribute('x'),
                        y = current.getAttribute('y');
                    clearElt(current);

                    if (y > 0) {
                        upper = board[x][y - 1];
                        if (upper && upper.firstChild) {
                            current.appendChild(upper.firstChild);
                            current.setAttribute(colorAttr, upper.getAttribute(colorAttr));
                            upper.removeAttribute(colorAttr);
                        }
                        board[x][y] = current;
                        if (y - 1 >= 0) {
                            shiftElt(upper);
                        }
                    }
                }
            };
        this.install = function fillOut() {
            for (i = 0, maxX = board.length; i < maxX; i += 1) {
                for (j = 0, maxY = board[i].length; j < maxY; j += 1) {
                    owner = board[i][j];
                    clearElt(owner);

                    config.color = owner.getAttribute(colorAttr) || colors[Math.floor((Math.random() * 5))];

                    owner.setAttribute(colorAttr, config.color);
                    owner.setAttribute('x', i.toString());
                    owner.setAttribute('y', j.toString());

                    var item = element.generate(type, config);

                    owner.appendChild(item);
                }
            }
        };

        area.element.addEventListener('click', function (e) {
            var current = e.target || e.srcElement,
                x, y, els, max;

            if (current.nodeName.toLowerCase() !== "canvas") {
                return;
            }

            var holder = current.parentElement;
            x = +holder.getAttribute('x');
            y = +holder.getAttribute('y');

            els = algorithms.siblingSearch(board, { x: x, y: y },
                function (elt) {
                    return elt.getAttribute(colorAttr);
                },
                function (a, b) {
                    return a.getAttribute('y') - b.getAttribute('y');
                }),
                max = els.length;

            if (max === 1) {
                return;
            }

            updateScore(calculateScore(max));
            shift(els);
        }, true);
        return this;
    }

    //Runner
    var desc = area.build(10, 10, {
        width: 20,
        height: 20,
        padding: 0
    })
    Game["Bubbles"](desc, function (score) {
        var doc = document,
            div = doc.getElementById('score'),
            h1 = div.getElementsByTagName('h1')[0];

        h1.innerHTML = score;
    }).install();
}());




