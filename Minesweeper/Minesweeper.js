angular.module('app.ctrl.Minesweeper', [
])
.controller('app.ctrl.Minesweeper', function($scope, $timeout, Game, Grid) {
    var game;
    function start_game() {
        game = Game($scope, $timeout, { mines_count: 10 });
        $scope.game = game;
    }
    start_game();

    $scope.restart_game = function() {
        game.over.value = true;
        start_game();
    };
})
.factory('Grid', function(Cell) {
    return function($scope, $timeout, args) {
        var game        = args.game;
        var rows        = args.rows        ||  9;
        var cols        = args.cols        ||  9;
        var mines_count = args.mines_count || 10;
        var grid;
        var mines_positions;
        var already_visited_cells = [];

        function create_grid() {
            grid = _.range(1, 1+rows).map(function(row) {
                return _.range(1, 1+cols).map(function(col) {
//                    return [row - 1, col - 1];
                    return Cell($scope, { has_mine: false });
                });
            });
        }
        create_grid();
        $scope.grid = grid;
//        console.log(grid);

        function burrow_mines() {
            var mc = mines_count;
            mines_positions = [];
            do {
                var new_mine_row = rand(0, rows - 1);
                var new_mine_col = rand(0, cols - 1);

                if (
                    _.any(mines_positions, function(mine_pos) {
                        return mine_pos[0] == new_mine_row && mine_pos[1] == new_mine_col
                    })
                ) {
                    continue;
                } else {
                    mines_positions.push( [ new_mine_row, new_mine_col ] );
                    grid[new_mine_row][new_mine_col].has_mine = true;
                    mc -= 1;
                }
            } while (mc > 0);
        };
        burrow_mines();
//        console.log(mines_positions);

        function on_cell_click(row, col, cell) {
//            console.log(row, col, cell);
            if (game.over.value || cell.was_clicked) { return; }

            // If we clicked on a mine...
            if (
                _.any(mines_positions, function(mine_pos) {
                    return mine_pos[0] == row && mine_pos[1] == col
                })
            ) {
                cell.was_clicked = true;
                player_loses();
                return
            }

            visit_neighbouring_cells(row, col, cell, already_visited_cells);
//            console.log(already_visited_cells.length);

            if (already_visited_cells.length + mines_count == rows * cols) {
                player_wins();
            }
        };
        $scope.on_cell_click = on_cell_click;

        function visit_neighbouring_cells(row, col, cell, already_visited_cells) {
            already_visited_cells = already_visited_cells || [];
            if (cell.was_clicked) { return; }

            // Visiting a cell is the same as the cell being clicked.
            cell.was_clicked = true;
            already_visited_cells.push([row, col]);
            cell.adjacent_mines_count = cell_calculate_adjacent_mines_count(row, col);
            var cell_is_adjacent_to_a_mine = cell.adjacent_mines_count != 0;
            if (cell_is_adjacent_to_a_mine) { return; }

            var neighbours_positions = cell_get_neighbours_positions(row, col);

            _.forEach(neighbours_positions, function(neighbour_position) {
                var x = neighbour_position[0];
                var y = neighbour_position[1];
                if (!grid[x][y].has_mine && !grid[x][y].was_clicked) {
                    grid[x][y].adjacent_mines_count = cell_calculate_adjacent_mines_count(x, y);
                    visit_neighbouring_cells(x, y, grid[x][y], already_visited_cells);
                }
            });
        };
//        visit_neighbouring_cells(0, 0, grid[0][0]);

        function cell_get_neighbours_positions(row, col) {
            var neighbours_positions = [
                [row - 1, col - 1], [row - 1, col - 0], [row - 1, col + 1],
                [row - 0, col - 1], [row - 0, col - 0], [row - 0, col + 1],
                [row + 1, col - 1], [row + 1, col - 0], [row + 1, col + 1],
            ];

             // Some neighbours could turn out to be outside of the grid, get rid of them.
            neighbours_positions = _.filter(neighbours_positions, function(cell_pos) {
                var x = cell_pos[0];
                var y = cell_pos[1];

                return 0 <= x && x <= rows - 1
                   &&  0 <= y && y <= cols - 1;
            });

            return neighbours_positions;
        };

        function cell_calculate_adjacent_mines_count(row, col) {
            var neighbours_positions = cell_get_neighbours_positions(row, col);
            return _.reduce(_.map(neighbours_positions, function(neighbour_position) {
                var x = neighbour_position[0];
                var y = neighbour_position[1];
                return grid[x][y].has_mine ? 1 : 0;
            }), function(a, b) { return a + b; });

        };

        function player_wins() {
            game.over.value = true;
            game.win.value = true;
            console.log('win');
            reveal_mines();
        };

        function player_loses() {
            game.over.value = true;
            game.lose.value = true;
            console.log('lose');
            reveal_mines();
        };

        function reveal_mines() {
            _.forEach(mines_positions, function(mine_position) {
                var x = mine_position[0];
                var y = mine_position[1];
                grid[x][y].was_clicked = true;
            });
        }

        return {
            grid: grid,
        };
    };
})
.factory('Cell', function() {
    return function($scope, args) {
        var has_mine    = args.has_mine || false;
        var was_clicked = false;
//        var mine_image_src = '';
        var adjacent_mines_count = 0;

        return  {
            has_mine:             has_mine,
            was_clicked:          was_clicked,
            adjacent_mines_count: adjacent_mines_count,
        };
    };
})
.factory('Game', function(Grid) {
    return function($scope, $timeout, args) {
        var mines_count = args.mines_count;
        var time  = 0;
        var over  = { value: false };
        var win   = { value: false };
        var lose  = { value: false };

        var grid = Grid($scope, $timeout, {
            game: { over: over, win: win, lose: lose },
            rows: 9, cols: 9, mines_count: mines_count
        });

        var get_time = function() { return time; }

        function tick() {
            if (!over.value) {
                time++;
                $timeout(tick, 1000);
            }
        }
        $timeout(tick, 1000);

        return {
            over:        over,
            win:         win,
            lose:        lose,
            mines_count: mines_count,
            get_time:    get_time,

            sixth_sense: false,
        };
    };
})
;

function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
